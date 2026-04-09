package com.scoh.api.dto;

import com.scoh.api.domain.TicketCategory;
import com.scoh.api.domain.TicketPriority;
import com.scoh.api.domain.TicketStatus;
import java.time.Instant;
import java.util.List;

public record TicketResponse(
        String id,
        String resourceId,
        String resourceName,
        String title,
        String description,
        String location,
        TicketCategory category,
        TicketPriority priority,
        String preferredContactDetails,
        TicketStatus status,
        String rejectionReason,
        String resolutionNotes,
        String createdByUserId,
        String createdByName,
        String assignedToUserId,
        String assignedToName,
        Instant createdAt,
        Instant updatedAt,
        List<TicketAttachmentResponse> attachments,
        List<TicketUpdateResponse> updates) {
}
