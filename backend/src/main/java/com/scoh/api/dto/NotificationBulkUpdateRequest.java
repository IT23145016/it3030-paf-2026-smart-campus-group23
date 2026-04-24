package com.scoh.api.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationBulkUpdateRequest(
        @NotNull(message = "The read flag is required.")
        Boolean read) {
}
