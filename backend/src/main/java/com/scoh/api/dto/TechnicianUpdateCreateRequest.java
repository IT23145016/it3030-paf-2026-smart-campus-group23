package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;

public record TechnicianUpdateCreateRequest(@NotBlank String message) {
}
