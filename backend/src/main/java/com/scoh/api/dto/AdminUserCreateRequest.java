package com.scoh.api.dto;

import com.scoh.api.domain.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.Set;

public record AdminUserCreateRequest(
        @NotBlank @Email String email,
        @NotBlank String fullName,
        String avatarUrl,
        Set<Role> roles) {
}
