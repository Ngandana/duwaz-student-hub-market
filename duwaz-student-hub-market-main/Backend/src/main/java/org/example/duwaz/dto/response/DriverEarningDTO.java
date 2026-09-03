package org.example.duwaz.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DriverEarningDTO(
        Long id,
        DriverDTO driver,
        OrderDTO order,
        BigDecimal amount,
        BigDecimal orderTotal,
        LocalDateTime earnedAt,
        String description
) {}
