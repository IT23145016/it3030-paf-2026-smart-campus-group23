package com.scoh.api.dto;

import com.scoh.api.domain.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record TicketNotificationRequest(
        @NotBlank String recipientUserId,
        @NotNull NotificationType type,
        @NotBlank String ticketId,
        @NotBlank String title,
        @NotBlank String message,
        String targetUrl,
        Map<String, Object> metadata) {
}
