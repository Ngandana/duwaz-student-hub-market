package org.example.duwaz.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record StudentRewardDTO(
        Long id,
        StudentDTO student,
        OrderDTO order,
        Integer pointsEarned,
        BigDecimal orderAmount,
        LocalDateTime earnedAt,
        String description
) {}
