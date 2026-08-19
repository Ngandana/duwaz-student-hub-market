package org.example.duwaz.service;

import org.example.duwaz.classesFolder.DeliverDriver;
import org.example.duwaz.classesFolder.DeliverDriver.DriverStatus;
import org.example.duwaz.classesFolder.DeliveryAssignment;
import org.example.duwaz.classesFolder.DeliveryAssignment.DeliveryStatus;
import org.example.duwaz.classesFolder.Order;
import org.example.duwaz.repo.DeliverDriverRepository;
import org.example.duwaz.repo.DeliveryAssignmentRepository;
import org.example.duwaz.repo.OrderRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
@Transactional
public class DeliveryAssignmentService {

    private final DeliveryAssignmentRepository assignmentRepository;
    private final DeliverDriverRepository driverRepository;
    private final OrderRepository orderRepository;
    private final StoreMessageService messageService;
    private final EmailService emailService;
    private final TransactionService transactionService;

    public DeliveryAssignmentService(DeliveryAssignmentRepository assignmentRepository,
                                      DeliverDriverRepository driverRepository,
                                      OrderRepository orderRepository,
                                      @Lazy StoreMessageService messageService,
                                      EmailService emailService,
                                      @Lazy TransactionService transactionService) {
        this.assignmentRepository = assignmentRepository;
        this.driverRepository = driverRepository;
        this.orderRepository = orderRepository;
        this.messageService = messageService;
        this.emailService = emailService;
        this.transactionService = transactionService;
    }

    /** Admin assigns a driver to an order */
    public DeliveryAssignment assignDriver(Long orderId, Long driverId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));
        DeliverDriver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver not found: " + driverId));

        if (driver.getStatus() != DriverStatus.AVAILABLE) {
            throw new RuntimeException("Driver is not available. Current status: " + driver.getStatus());
        }

        // Remove existing assignment if any
        assignmentRepository.findByOrderId(orderId).ifPresent(existing -> {
            assignmentRepository.delete(existing);
            // Free the previous driver
            existing.getDriver().setStatus(DriverStatus.AVAILABLE);
            driverRepository.save(existing.getDriver());
        });

        // Generate OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        DeliveryAssignment assignment = new DeliveryAssignment();
        assignment.setOrder(order);
        assignment.setDriver(driver);
        assignment.setDeliveryStatus(DeliveryStatus.ASSIGNED);
        assignment.setOtpCode(otp);

        // Mark driver busy
        driver.setStatus(DriverStatus.BUSY);
        driverRepository.save(driver);

        // Update order status
        order.setStatus(Order.OrderStatus.OUT_FOR_DELIVERY);
        orderRepository.save(order);

        DeliveryAssignment saved = assignmentRepository.save(assignment);

        // Send OTP to the customer's email address (async — won't block response)
        if (order.getStudent() != null && order.getStudent().getEmail() != null) {
            emailService.sendOtpEmail(
                order.getStudent().getEmail(),
                order.getStudent().getStudentName(),
                otp,
                order.getId()
            );
        }

        return saved;
    }

    /** Driver accepts a delivery */
    public DeliveryAssignment updateStatus(Long assignmentId, DeliveryStatus newStatus,
                                            String notes, String proofOfDelivery) {
        DeliveryAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found: " + assignmentId));

        assignment.setDeliveryStatus(newStatus);

        switch (newStatus) {
            case DRIVER_ACCEPTED -> assignment.setAcceptedAt(LocalDateTime.now());
            case PICKED_UP -> assignment.setPickedUpAt(LocalDateTime.now());
            case DELIVERED -> {
                assignment.setDeliveredAt(LocalDateTime.now());
                // Mark driver available again
                DeliverDriver driver = assignment.getDriver();
                driver.setStatus(DriverStatus.AVAILABLE);
                driver.setDeliveryCount(driver.getDeliveryCount() + 1);
                driverRepository.save(driver);
                // Update order
                Order deliveredOrder = assignment.getOrder();
                deliveredOrder.setStatus(Order.OrderStatus.DELIVERED);
                orderRepository.save(deliveredOrder);
                // Create transaction + award loyalty points (5% of total)
                try {
                    transactionService.createDeliveryTransaction(deliveredOrder);
                    transactionService.recordDriverEarning(deliveredOrder, driver);
                } catch (Exception e) {
                    System.err.println("[DeliveryAssignmentService] Transaction/earning creation failed: " + e.getMessage());
                }
            }
            case DELIVERY_FAILED, CANCELLED -> {
                if (notes != null) assignment.setFailureReason(notes);
                DeliverDriver driver = assignment.getDriver();
                driver.setStatus(DriverStatus.AVAILABLE);
                driverRepository.save(driver);
            }
        }

        if (notes != null && !notes.isEmpty() && newStatus != DeliveryStatus.DELIVERY_FAILED) {
            assignment.setDeliveryNotes(notes);
        }
        if (proofOfDelivery != null && !proofOfDelivery.isEmpty()) {
            assignment.setProofOfDelivery(proofOfDelivery);
        }

        DeliveryAssignment saved = assignmentRepository.save(assignment);

        // Notify Admin and shop owner of the status change
        try {
            messageService.notifyStatusChange(saved);
        } catch (Exception e) {
            // Non-critical — don't fail the status update if notification fails
        }

        return saved;
    }

    /** Verify OTP for delivery confirmation */
    public DeliveryAssignment verifyOtp(Long assignmentId, String otp) {
        DeliveryAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        if (!assignment.getOtpCode().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }
        assignment.setOtpVerified(true);
        return assignmentRepository.save(assignment);
    }

    public List<DeliveryAssignment> getAssignmentsByDriver(Long driverId) {
        return assignmentRepository.findByDriverDeliveryDriverId(driverId);
    }

    public List<DeliveryAssignment> getActiveAssignmentsByDriver(Long driverId) {
        return assignmentRepository.findByDriverDeliveryDriverId(driverId).stream()
                .filter(a -> a.getDeliveryStatus() != DeliveryStatus.DELIVERED
                        && a.getDeliveryStatus() != DeliveryStatus.DELIVERY_FAILED
                        && a.getDeliveryStatus() != DeliveryStatus.CANCELLED)
                .toList();
    }

    public Optional<DeliveryAssignment> getAssignmentByOrder(Long orderId) {
        return assignmentRepository.findByOrderId(orderId);
    }

    public Optional<DeliveryAssignment> getAssignmentById(Long assignmentId) {
        return assignmentRepository.findById(assignmentId);
    }

    public List<DeliveryAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public List<DeliveryAssignment> getAssignmentsByStatus(DeliveryStatus status) {
        return assignmentRepository.findByDeliveryStatus(status);
    }
}
