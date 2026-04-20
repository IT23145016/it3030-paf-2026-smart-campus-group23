package com.scoh.api.dto;

import com.scoh.api.domain.TicketCategory;
import com.scoh.api.domain.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TicketCreateRequest(
        @NotBlank String resourceId,
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String location,
        @NotNull TicketCategory category,
        @NotNull TicketPriority priority,
        @NotBlank String preferredContactDetails) {
}
