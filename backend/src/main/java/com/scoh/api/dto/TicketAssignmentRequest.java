package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketAssignmentRequest(@NotBlank String technicianId) {
}
