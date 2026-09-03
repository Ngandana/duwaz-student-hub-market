package org.example.duwaz.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionDTO(
        Long id,
        StudentDTO student,
        ProductDTO product,
        OrderDTO order,
        BigDecimal amount,
        LocalDateTime transactionDate,
        String status
) {}
