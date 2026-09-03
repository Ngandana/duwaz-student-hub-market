package org.example.duwaz.dto.response;

import java.math.BigDecimal;

public record OrderItemDTO(
        Long id,
        ProductDTO product,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {}
