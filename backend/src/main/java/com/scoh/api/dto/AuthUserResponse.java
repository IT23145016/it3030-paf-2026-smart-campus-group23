package com.scoh.api.dto;

import com.scoh.api.domain.Role;
import java.util.Set;

public record AuthUserResponse(
        String id,
        String email,
        String fullName,
        String avatarUrl,
        Set<Role> roles,
        NotificationPreferencesResponse notificationPreferences) {
}
