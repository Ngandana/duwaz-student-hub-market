package org.example.duwaz.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ReviewDTO(
        Long id,
        Long studentId,
        Long productId,
        BigDecimal rating,
        String comment,
        LocalDateTime reviewDate
) {}
