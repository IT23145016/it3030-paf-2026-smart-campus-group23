package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AvailabilityWindowRequest(
        @NotBlank(message = "Availability day is required.")
        String dayOfWeek,

        @NotBlank(message = "Opening time is required.")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Opening time must use HH:mm format.")
        String startTime,

        @NotBlank(message = "Closing time is required.")
        @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Closing time must use HH:mm format.")
        String endTime) {
}
