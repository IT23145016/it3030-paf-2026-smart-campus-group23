package com.scoh.api.controller;

import com.scoh.api.dto.AdminUserCreateRequest;
import com.scoh.api.dto.AdminUserUpdateRequest;
import com.scoh.api.dto.RoleUpdateRequest;
import com.scoh.api.dto.UserStatusUpdateRequest;
import com.scoh.api.dto.UserSummaryResponse;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.UserAccountService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
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
    public ResponseEntity<List<UserSummaryResponse>> getAllUsers() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.SECONDS).mustRevalidate())
                .body(userAccountService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserSummaryResponse> createUser(@Valid @RequestBody AdminUserCreateRequest request) {
        UserSummaryResponse createdUser = userAccountService.createUser(request, SecurityUtils.currentUser().getId());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{userId}")
                .buildAndExpand(createdUser.id())
                .toUri();
        return ResponseEntity.created(location).body(createdUser);
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

    @PatchMapping("/{userId}")
    public UserSummaryResponse patchUser(
            @PathVariable String userId,
            @RequestBody AdminUserUpdateRequest request) {
        return userAccountService.patchUser(userId, request, SecurityUtils.currentUser().getId());
    }

    @DeleteMapping("/{userId}")
    public Map<String, String> deleteUser(@PathVariable String userId) {
        userAccountService.deleteUser(userId, SecurityUtils.currentUser().getId());
        return Map.of("message", "User deleted successfully.");
    }
}
