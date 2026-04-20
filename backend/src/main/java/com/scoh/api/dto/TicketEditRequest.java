package com.scoh.api.dto;

import com.scoh.api.domain.TicketCategory;
import com.scoh.api.domain.TicketPriority;

public record TicketEditRequest(
        String title,
        String description,
        String location,
        TicketCategory category,
        TicketPriority priority,
        String preferredContactDetails) {
}
