package com.scoh.api.dto;

import com.scoh.api.domain.Role;
import java.util.Set;

public record AdminUserUpdateRequest(
        Set<Role> roles,
        Boolean active) {
}
