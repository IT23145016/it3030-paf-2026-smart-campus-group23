package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketCommentEditRequest(@NotBlank String message) {
}
