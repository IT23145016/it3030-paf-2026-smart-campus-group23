package com.scoh.api.dto;

import java.time.Instant;

public record TicketAttachmentResponse(
        String id,
        String originalFileName,
        String contentType,
        long size,
        Instant uploadedAt,
        String uploadedByUserId,
        String downloadUrl) {
}
