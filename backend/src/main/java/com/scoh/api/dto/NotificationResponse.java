package com.scoh.api.dto;

import com.scoh.api.domain.NotificationType;
import java.time.Instant;
import java.util.Map;

public record NotificationResponse(
        String id,
        NotificationType type,
        String title,
        String message,
        boolean read,
        String targetUrl,
        Map<String, Object> metadata,
        Instant createdAt) {
}
