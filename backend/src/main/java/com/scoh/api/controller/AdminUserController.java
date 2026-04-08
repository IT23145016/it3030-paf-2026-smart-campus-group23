package com.scoh.api.controller;

import com.scoh.api.dto.AdminUserCreateRequest;
import com.scoh.api.dto.RoleUpdateRequest;
import com.scoh.api.dto.UserStatusUpdateRequest;
import com.scoh.api.dto.UserSummaryResponse;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.UserAccountService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserAccountService userAccountService;

    public AdminUserController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping
    public List<UserSummaryResponse> getAllUsers() {
        return userAccountService.getAllUsers();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserSummaryResponse createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        return userAccountService.createUser(request, SecurityUtils.currentUser().getId());
    }

    @PutMapping("/{userId}/roles")
    public UserSummaryResponse updateRoles(@PathVariable String userId, @Valid @RequestBody RoleUpdateRequest request) {
        return userAccountService.updateRoles(userId, request.roles(), SecurityUtils.currentUser().getId());
    }

    @PatchMapping("/{userId}/status")
    public UserSummaryResponse updateUserStatus(
            @PathVariable String userId,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        return userAccountService.updateUserStatus(userId, request, SecurityUtils.currentUser().getId());
    }

    @DeleteMapping("/{userId}")
    public Map<String, String> deleteUser(@PathVariable String userId) {
        userAccountService.deleteUser(userId, SecurityUtils.currentUser().getId());
        return Map.of("message", "User deleted successfully.");
    }
}
