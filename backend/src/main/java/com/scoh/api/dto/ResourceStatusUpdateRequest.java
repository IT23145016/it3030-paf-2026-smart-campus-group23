package com.scoh.api.dto;

import com.scoh.api.domain.ResourceStatus;
import jakarta.validation.constraints.NotNull;

public record ResourceStatusUpdateRequest(
        @NotNull(message = "Resource status is required.")
        ResourceStatus status) {
}
