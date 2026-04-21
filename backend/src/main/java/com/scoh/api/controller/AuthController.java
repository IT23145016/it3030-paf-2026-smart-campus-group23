package com.scoh.api.controller;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.AuthUserResponse;
import com.scoh.api.dto.NotificationPreferencesResponse;
import com.scoh.api.dto.NotificationPreferencesUpdateRequest;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping("/me")
    public AuthUserResponse me() {
        UserAccount sessionUser = SecurityUtils.currentUser();
        UserAccount user = userAccountService.findById(sessionUser.getId());
        if (!user.isActive()) {
            throw new ForbiddenOperationException("Your account has been deactivated by an administrator.");
        }
        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRoles(),
                userAccountService.toNotificationPreferences(user));
    }

    @PatchMapping("/notification-preferences")
    public NotificationPreferencesResponse updateNotificationPreferences(
            @Valid @RequestBody NotificationPreferencesUpdateRequest request) {
        UserAccount sessionUser = SecurityUtils.currentUser();
        return userAccountService.updateNotificationPreferences(sessionUser.getId(), request);
    }
}
