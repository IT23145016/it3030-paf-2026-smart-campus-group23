package com.scoh.api.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationReadUpdateRequest(
        @NotNull(message = "The read flag is required.")
        Boolean read) {
}
