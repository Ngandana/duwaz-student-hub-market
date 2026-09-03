package org.example.duwaz.dto.response;

import java.math.BigDecimal;

public record ProductDTO(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        Integer stockQuantity,
        String productStatus,
        CategoryDTO category,
        BusinessDTO business
) {}
