package org.example.duwaz.dto.response;

import java.time.LocalDateTime;

public record StoreMessageDTO(
        Long id,
        BusinessDTO business,
        DriverDTO driver,
        OrderDTO order,
        String messageType,
        String status,
        String subject,
        String content,
        String replyContent,
        LocalDateTime sentAt,
        LocalDateTime readAt,
        LocalDateTime repliedAt,
        Boolean fromAdmin
) {}
