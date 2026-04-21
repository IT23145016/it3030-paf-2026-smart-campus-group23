package com.scoh.api.dto;

public record NotificationPreferencesResponse(
        boolean bookingDecisionsEnabled,
        boolean ticketStatusChangesEnabled,
        boolean ticketCommentsEnabled) {
}
