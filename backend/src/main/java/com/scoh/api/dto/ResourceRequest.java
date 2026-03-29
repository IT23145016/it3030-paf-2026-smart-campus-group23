package com.scoh.api.dto;

import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ResourceRequest(
        @NotBlank(message = "Resource code is required.")
        @Size(max = 30, message = "Resource code must be 30 characters or fewer.")
        String resourceCode,

        @NotBlank(message = "Resource name is required.")
        @Size(max = 120, message = "Resource name must be 120 characters or fewer.")
        String name,

        @NotNull(message = "Resource type is required.")
        ResourceType type,

        @NotNull(message = "Capacity is required.")
        @Min(value = 1, message = "Capacity must be at least 1.")
        Integer capacity,

        @NotBlank(message = "Location is required.")
        @Size(max = 120, message = "Location must be 120 characters or fewer.")
        String location,

        @NotNull(message = "Resource status is required.")
        ResourceStatus status,

        @Size(max = 500, message = "Description must be 500 characters or fewer.")
        String description,

        List<@NotBlank(message = "Amenities cannot contain blank values.") String> amenities,

        @NotEmpty(message = "At least one availability window is required.")
        List<@Valid AvailabilityWindowRequest> availabilityWindows) {
}
