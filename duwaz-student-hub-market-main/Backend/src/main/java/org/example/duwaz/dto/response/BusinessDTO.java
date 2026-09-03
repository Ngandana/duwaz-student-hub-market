package org.example.duwaz.dto.response;

public record BusinessDTO(
        Long id,
        String businessName,
        String description,
        String logoUrl,
        String shopCategory,
        String phoneNumber,
        String operatingHours,
        StudentDTO student
) {}
