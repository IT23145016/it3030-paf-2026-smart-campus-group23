package com.scoh.api.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationPreferencesUpdateRequest(
        @NotNull Boolean bookingDecisionsEnabled,
        @NotNull Boolean ticketStatusChangesEnabled,
        @NotNull Boolean ticketCommentsEnabled) {
}
