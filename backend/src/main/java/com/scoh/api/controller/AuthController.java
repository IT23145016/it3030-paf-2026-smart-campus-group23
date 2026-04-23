package com.scoh.api.controller;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.AuthUserResponse;
import com.scoh.api.dto.LocalLoginRequest;
import com.scoh.api.dto.LocalRegisterRequest;
import com.scoh.api.dto.NotificationPreferencesResponse;
import com.scoh.api.dto.NotificationPreferencesUpdateRequest;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.security.AppUserPrincipal;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> register(@Valid @RequestBody LocalRegisterRequest request) {
        userAccountService.registerLocalUser(request);
        return Map.of("message", "Account created successfully. Please sign in.");
    }

    @PostMapping("/login")
    public AuthUserResponse login(
            @Valid @RequestBody LocalLoginRequest request,
            HttpServletRequest httpRequest) {

        UserAccount user = userAccountService.authenticateLocalUser(request);

        AppUserPrincipal principal = new AppUserPrincipal(user, Map.of());
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContextHolder.getContext().setAuthentication(authentication);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(
                HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                SecurityContextHolder.getContext());

        return new AuthUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getRoles(),
                userAccountService.toNotificationPreferences(user));
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
