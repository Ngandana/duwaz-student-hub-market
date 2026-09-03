package org.example.duwaz.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDTO(
        Long id,
        StudentDTO student,
        BusinessDTO business,
        List<OrderItemDTO> items,
        BigDecimal totalAmount,
        BigDecimal deliveryFee,
        Integer pointsRedeemed,
        LocalDateTime orderDate,
        String status,
        String deliveryAddress,
        String cancellationReason
) {}
