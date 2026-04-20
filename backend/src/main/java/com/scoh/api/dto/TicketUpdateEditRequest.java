package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TicketUpdateEditRequest(@NotBlank String message) {
}
