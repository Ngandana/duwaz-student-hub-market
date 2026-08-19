package org.example.duwaz.service;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.classesFolder.DeliveryAssignment;
import org.example.duwaz.classesFolder.DeliveryAssignment.DeliveryStatus;
import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.dto.TrackingResponse;
import org.example.duwaz.repo.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class TrackingService {

    private final OrderRepository orderRepository;
    private final DeliveryAssignmentService assignmentService;

    public TrackingService(OrderRepository orderRepository,
                           DeliveryAssignmentService assignmentService) {
        this.orderRepository = orderRepository;
        this.assignmentService = assignmentService;
    }

    /**
     * Build a full tracking snapshot for the given order.
     * Returns empty if the order doesn't exist.
     */
    public Optional<TrackingResponse> getTrackingForOrder(Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) return Optional.empty();

        Order order = orderOpt.get();
        TrackingResponse response = new TrackingResponse();

        // ── Order info ────────────────────────────────────────────────────────
        response.setOrderId(order.getId());
        response.setOrderStatus(order.getStatus());
        response.setTotalAmount(order.getTotalAmount());
        response.setOrderDate(order.getOrderDate());
        response.setDeliveryAddress(order.getDeliveryAddress());

        if (order.getBusiness() != null) {
            response.setShopName(order.getBusiness().getBusinessName());
            response.setShopPhone(order.getBusiness().getPhoneNumber());
        }

        // ── Delivery assignment ───────────────────────────────────────────────
        Optional<DeliveryAssignment> assignmentOpt = assignmentService.getAssignmentByOrder(orderId);
        if (assignmentOpt.isPresent()) {
            DeliveryAssignment a = assignmentOpt.get();
            response.setAssignmentId(a.getId());
            response.setDeliveryStatus(a.getDeliveryStatus());
            response.setAssignedAt(a.getAssignedAt());
            response.setAcceptedAt(a.getAcceptedAt());
            response.setPickedUpAt(a.getPickedUpAt());
            response.setDeliveredAt(a.getDeliveredAt());
            response.setDeliveryNotes(a.getDeliveryNotes());
            response.setFailureReason(a.getFailureReason());
            response.setOtpVerified(a.isOtpVerified());

            // ── OTP — always expose to the customer so they can give it to the driver ──
            if (!a.isOtpVerified() && a.getDeliveryStatus() != DeliveryAssignment.DeliveryStatus.DELIVERED) {
                response.setOtpCode(a.getOtpCode());
            }

            // ── Driver info & live location ───────────────────────────────────
            DeliverDriver driver = a.getDriver();
            if (driver != null) {
                response.setDriverId(driver.getDeliveryDriverId());
                response.setDriverName(driver.getFullName());
                response.setDriverPhone(driver.getContactNumber());
                response.setVehicleType(driver.getVehicleType());
                response.setDriverRating(driver.getRating());
                response.setDriverLatitude(driver.getLatitude());
                response.setDriverLongitude(driver.getLongitude());
                response.setLocationUpdatedAt(driver.getLastLocationUpdate());
            }

            // ── Compute stage ─────────────────────────────────────────────────
            int[] stageInfo = resolveStage(a.getDeliveryStatus());
            response.setCurrentStage(stageInfo[0]);
            response.setCurrentStageLabel(STAGE_LABELS[stageInfo[0] - 1]);

            // ── Compute ETA (max 10 min, decrements by stage) ─────────────────
            response.setEstimatedArrivalMinutes(computeEta(a.getDeliveryStatus(), a.getAssignedAt()));

        } else {
            // No driver assigned yet — stage 1 (order placed / preparing)
            response.setCurrentStage(resolveStageFromOrderStatus(order.getStatus()));
            response.setCurrentStageLabel(STAGE_LABELS[response.getCurrentStage() - 1]);
        }

        return Optional.of(response);
    }

    // ── Stage resolution ──────────────────────────────────────────────────────
    // Stages: 1=Order Placed, 2=Driver Assigned, 3=Picked Up From Shop, 4=On The Way, 5=Delivered

    private static final String[] STAGE_LABELS = {
        "Order Placed",
        "Driver Assigned",
        "Picked Up From Shop",
        "On The Way To You",
        "Delivered"
    };

    /** Map a DeliveryStatus to a stage number (1-5). Returns {stage, ignored}. */
    private int[] resolveStage(DeliveryStatus status) {
        return switch (status) {
            case PENDING_ASSIGNMENT, ASSIGNED -> new int[]{2, 0};
            case DRIVER_ACCEPTED, TRAVELLING_TO_SHOP -> new int[]{2, 0};
            case PICKED_UP -> new int[]{3, 0};
            case TRAVELLING_TO_CUSTOMER, ARRIVED -> new int[]{4, 0};
            case DELIVERED -> new int[]{5, 0};
            case DELIVERY_FAILED, CANCELLED -> new int[]{1, 0}; // reset to 1 so UI shows failure
        };
    }

    /** For orders without a delivery assignment yet, derive stage from order status. */
    private int resolveStageFromOrderStatus(Order.OrderStatus status) {
        return switch (status) {
            case PENDING -> 1;
            case CONFIRMED, PREPARING, READY_FOR_PICKUP -> 1;
            case OUT_FOR_DELIVERY -> 2;
            case DELIVERED -> 5;
            default -> 1;
        };
    }

    /**
     * ETA logic: max 10 minutes, decreasing by delivery stage and elapsed time.
     * - ASSIGNED / DRIVER_ACCEPTED     → up to 10 min
     * - TRAVELLING_TO_SHOP             → up to 7 min
     * - PICKED_UP                      → up to 5 min
     * - TRAVELLING_TO_CUSTOMER / ARRIVED → up to 3 min
     * - DELIVERED / FAILED             → 0
     * Within each band we subtract elapsed minutes since the assignment was created,
     * clamped between 1 and the band max.
     */
    private Integer computeEta(DeliveryStatus status, LocalDateTime assignedAt) {
        return switch (status) {
            case DELIVERED, DELIVERY_FAILED, CANCELLED -> 0;
            default -> {
                int bandMax = switch (status) {
                    case ASSIGNED, DRIVER_ACCEPTED    -> 10;
                    case TRAVELLING_TO_SHOP           -> 7;
                    case PICKED_UP                    -> 5;
                    case TRAVELLING_TO_CUSTOMER, ARRIVED -> 3;
                    default -> 10;
                };
                long elapsedMinutes = assignedAt != null
                        ? ChronoUnit.MINUTES.between(assignedAt, LocalDateTime.now())
                        : 0;
                int remaining = (int) Math.max(1, bandMax - elapsedMinutes);
                yield Math.min(remaining, bandMax);
            }
        };
    }
}
