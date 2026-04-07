package com.scoh.api.security;

import com.scoh.api.domain.Role;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.exception.ForbiddenOperationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserAccount currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserPrincipal appUserPrincipal) {
            return appUserPrincipal.getUser();
        }
        if (principal instanceof AppOidcUser appOidcUser) {
            return appOidcUser.getUser();
        }
        throw new ForbiddenOperationException("Authenticated user context is unavailable.");
    }

    public static boolean hasRole(Role role) {
        return currentUser().getRoles().contains(role);
    }
}
