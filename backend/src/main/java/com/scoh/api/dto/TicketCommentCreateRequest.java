package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketCommentCreateRequest(@NotBlank String message) {
}
