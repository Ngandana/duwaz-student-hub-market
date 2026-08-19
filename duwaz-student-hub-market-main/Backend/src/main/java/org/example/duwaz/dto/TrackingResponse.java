package org.example.duwaz.dto;

import org.example.duwaz.classesFolder.DeliveryAssignment.DeliveryStatus;
import org.example.duwaz.classesFolder.Order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Complete tracking snapshot returned to the customer for a single order.
 * Combines Order + DeliveryAssignment + live driver location into one response.
 */
public class TrackingResponse {

    // ── Order summary ─────────────────────────────────────────────────────────
    private Long orderId;
    private OrderStatus orderStatus;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;
    private String deliveryAddress;

    // Shop info
    private String shopName;
    private String shopPhone;

    // ── Delivery assignment ───────────────────────────────────────────────────
    private Long assignmentId;
    private DeliveryStatus deliveryStatus;
    private LocalDateTime assignedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime pickedUpAt;
    private LocalDateTime deliveredAt;
    private String deliveryNotes;
    private String failureReason;
    private boolean otpVerified;
    // The OTP shown to the customer so they can give it to the driver at doorstep
    private String otpCode;

    // ── Driver info ───────────────────────────────────────────────────────────
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehicleType;
    private float driverRating;

    // ── Live location ─────────────────────────────────────────────────────────
    private Double driverLatitude;
    private Double driverLongitude;
    private LocalDateTime locationUpdatedAt;

    // ── Tracking stage (human-readable current step 1-5) ─────────────────────
    private int currentStage;           // 1=Order placed, 2=Driver assigned, 3=Picked up, 4=On the way, 5=Delivered
    private String currentStageLabel;

    // ── ETA ───────────────────────────────────────────────────────────────────
    // Estimated minutes remaining until delivery. Null if not yet calculable.
    private Integer estimatedArrivalMinutes;

    public TrackingResponse() {}

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public OrderStatus getOrderStatus() { return orderStatus; }
    public void setOrderStatus(OrderStatus orderStatus) { this.orderStatus = orderStatus; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getShopPhone() { return shopPhone; }
    public void setShopPhone(String shopPhone) { this.shopPhone = shopPhone; }

    public Long getAssignmentId() { return assignmentId; }
    public void setAssignmentId(Long assignmentId) { this.assignmentId = assignmentId; }

    public DeliveryStatus getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(DeliveryStatus deliveryStatus) { this.deliveryStatus = deliveryStatus; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }

    public LocalDateTime getPickedUpAt() { return pickedUpAt; }
    public void setPickedUpAt(LocalDateTime pickedUpAt) { this.pickedUpAt = pickedUpAt; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public boolean isOtpVerified() { return otpVerified; }
    public void setOtpVerified(boolean otpVerified) { this.otpVerified = otpVerified; }

    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }

    public Long getDriverId() { return driverId; }
    public void setDriverId(Long driverId) { this.driverId = driverId; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public float getDriverRating() { return driverRating; }
    public void setDriverRating(float driverRating) { this.driverRating = driverRating; }

    public Double getDriverLatitude() { return driverLatitude; }
    public void setDriverLatitude(Double driverLatitude) { this.driverLatitude = driverLatitude; }

    public Double getDriverLongitude() { return driverLongitude; }
    public void setDriverLongitude(Double driverLongitude) { this.driverLongitude = driverLongitude; }

    public LocalDateTime getLocationUpdatedAt() { return locationUpdatedAt; }
    public void setLocationUpdatedAt(LocalDateTime locationUpdatedAt) { this.locationUpdatedAt = locationUpdatedAt; }

    public int getCurrentStage() { return currentStage; }
    public void setCurrentStage(int currentStage) { this.currentStage = currentStage; }

    public String getCurrentStageLabel() { return currentStageLabel; }
    public void setCurrentStageLabel(String currentStageLabel) { this.currentStageLabel = currentStageLabel; }

    public Integer getEstimatedArrivalMinutes() { return estimatedArrivalMinutes; }
    public void setEstimatedArrivalMinutes(Integer estimatedArrivalMinutes) { this.estimatedArrivalMinutes = estimatedArrivalMinutes; }
}
