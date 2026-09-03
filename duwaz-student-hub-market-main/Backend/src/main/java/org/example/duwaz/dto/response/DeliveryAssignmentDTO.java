package org.example.duwaz.dto.response;

import java.time.LocalDateTime;

public record DeliveryAssignmentDTO(
        Long id,
        OrderDTO order,
        DriverDTO driver,
        String deliveryStatus,
        LocalDateTime assignedAt,
        LocalDateTime acceptedAt,
        LocalDateTime pickedUpAt,
        LocalDateTime deliveredAt,
        String deliveryNotes,
        String failureReason,
        String proofOfDelivery,
        String otpCode,
        Boolean otpVerified
) {}
