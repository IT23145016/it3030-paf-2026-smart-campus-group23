package com.scoh.api.dto;

import com.scoh.api.domain.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record TicketStatusUpdateRequest(
        @NotNull TicketStatus status,
        String resolutionNote,
        String rejectionReason) {
}
