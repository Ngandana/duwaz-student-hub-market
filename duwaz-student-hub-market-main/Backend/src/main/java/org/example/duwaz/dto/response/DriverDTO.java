package org.example.duwaz.dto.response;

import java.time.LocalDateTime;

/** Never carries a password field. */
public record DriverDTO(
        Long deliveryDriverId,
        String firstName,
        String lastName,
        String contactNumber,
        String email,
        String vehicleType,
        String licenseNumber,
        Integer deliveryCount,
        Float rating,
        String status,
        Boolean active,
        String profileImage,
        String emergencyContact,
        Double latitude,
        Double longitude,
        LocalDateTime lastLocationUpdate
) {}
