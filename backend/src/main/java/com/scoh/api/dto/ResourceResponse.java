package com.scoh.api.dto;

import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import java.time.Instant;
import java.util.List;

public record ResourceResponse(
        String id,
        String resourceCode,
        String name,
        ResourceType type,
        Integer capacity,
        String location,
        ResourceStatus status,
        String description,
        List<String> amenities,
        List<AvailabilityWindowRequest> availabilityWindows,
        Instant createdAt,
        Instant updatedAt) {
}
