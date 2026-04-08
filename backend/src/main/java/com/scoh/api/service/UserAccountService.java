package com.scoh.api.service;

import com.scoh.api.domain.Role;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.AdminUserCreateRequest;
import com.scoh.api.dto.UserStatusUpdateRequest;
import com.scoh.api.dto.UserSummaryResponse;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.UserAccountRepository;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final NotificationService notificationService;

    public UserAccountService(UserAccountRepository userAccountRepository, NotificationService notificationService) {
        this.userAccountRepository = userAccountRepository;
        this.notificationService = notificationService;
    }

    public UserAccount upsertOAuthUser(
            String email,
            String fullName,
            String avatarUrl,
            String provider,
            String providerId) {

        UserAccount user = userAccountRepository.findByEmailIgnoreCase(email)
                .orElseGet(UserAccount::new);

        user.setEmail(email);
        user.setFullName(fullName);
        user.setAvatarUrl(avatarUrl);
        user.setProvider(provider);
        user.setProviderId(providerId);
        return userAccountRepository.save(user);
    }

    public void ensureBootstrapRole(String email, boolean admin) {
        if (email == null || email.isBlank()) {
            return;
        }

        userAccountRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (admin) {
                user.setRoles(Set.of(Role.ADMIN, Role.USER));
            } else if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(Set.of(Role.USER));
            }
            userAccountRepository.save(user);
        });
    }

    public List<UserSummaryResponse> getAllUsers() {
        return userAccountRepository.findAll().stream()
                .map(this::toSummary)
                .toList();
    }

    public UserSummaryResponse createUser(AdminUserCreateRequest request, String actingUserId) {
        userAccountRepository.findByEmailIgnoreCase(request.email()).ifPresent(existing -> {
            throw new ForbiddenOperationException("A user already exists for email: " + request.email());
        });

        UserAccount user = new UserAccount();
        user.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        user.setFullName(request.fullName().trim());
        user.setAvatarUrl(request.avatarUrl());
        user.setProvider("ADMIN_CREATED");
        user.setProviderId(request.email().trim().toLowerCase(Locale.ROOT));
        user.setRoles(request.roles() == null || request.roles().isEmpty()
                ? Set.of(Role.USER)
                : request.roles());

        UserAccount saved = userAccountRepository.save(user);
        notificationService.createAccountCreatedNotification(saved);
        notificationService.createAdminAuditNotification(
                actingUserId,
                "User created",
                "You created an account for " + saved.getEmail() + ".",
                java.util.Map.of(
                        "targetUserId", saved.getId(),
                        "email", saved.getEmail(),
                        "roles", saved.getRoles(),
                        "active", saved.isActive()));
        return toSummary(saved);
    }

    public UserSummaryResponse updateRoles(String targetUserId, Set<Role> roles, String actingUserId) {
        UserAccount target = findById(targetUserId);
        if (target.getId().equals(actingUserId) && !roles.contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("Admins cannot remove their own ADMIN role.");
        }

        target.setRoles(roles);
        UserAccount saved = userAccountRepository.save(target);
        notificationService.createRoleUpdateNotification(saved);
        notificationService.createAdminAuditNotification(
                actingUserId,
                "Roles updated",
                "You updated roles for " + saved.getEmail() + ".",
                java.util.Map.of(
                        "targetUserId", saved.getId(),
                        "email", saved.getEmail(),
                        "roles", saved.getRoles()));
        return toSummary(saved);
    }

    public UserSummaryResponse updateUserStatus(String targetUserId, UserStatusUpdateRequest request, String actingUserId) {
        UserAccount target = findById(targetUserId);
        if (target.getId().equals(actingUserId) && !Boolean.TRUE.equals(request.active())) {
            throw new ForbiddenOperationException("Admins cannot deactivate their own account.");
        }

        target.setActive(Boolean.TRUE.equals(request.active()));
        UserAccount saved = userAccountRepository.save(target);
        notificationService.createAccountStatusNotification(saved);
        notificationService.createAdminAuditNotification(
                actingUserId,
                saved.isActive() ? "User activated" : "User deactivated",
                "You " + (saved.isActive() ? "activated " : "deactivated ") + saved.getEmail() + ".",
                java.util.Map.of(
                        "targetUserId", saved.getId(),
                        "email", saved.getEmail(),
                        "active", saved.isActive()));
        return toSummary(saved);
    }

    public void deleteUser(String targetUserId, String actingUserId) {
        UserAccount target = findById(targetUserId);
        if (target.getId().equals(actingUserId)) {
            throw new ForbiddenOperationException("Admins cannot delete their own account.");
        }
        notificationService.createAdminAuditNotification(
                actingUserId,
                "User deleted",
                "You deleted the account for " + target.getEmail() + ".",
                java.util.Map.of(
                        "targetUserId", target.getId(),
                        "email", target.getEmail()));
        userAccountRepository.delete(target);
    }

    public UserAccount findById(String userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found: " + userId));
    }

    public UserAccount findByEmail(String email) {
        return userAccountRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User not found for email: " + email));
    }

    public UserSummaryResponse toSummary(UserAccount user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.isActive(),
                user.getRoles(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }
}
