package com.scoh.api.dto;

import java.time.Instant;

public record TicketUpdateResponse(
        String id,
        String message,
        String updatedByUserId,
        String updatedByName,
        Instant createdAt,
        Instant editedAt) {
}
