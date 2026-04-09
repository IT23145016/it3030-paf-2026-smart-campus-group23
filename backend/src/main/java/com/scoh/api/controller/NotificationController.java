package com.scoh.api.controller;

import com.scoh.api.dto.NotificationCreateRequest;
import com.scoh.api.dto.NotificationResponse;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.NotificationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationResponse> getMyNotifications() {
        return notificationService.getNotificationsForUser(SecurityUtils.currentUser().getId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> getUnreadCount() {
        return Map.of("count", notificationService.getUnreadCount(SecurityUtils.currentUser().getId()));
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(@PathVariable String notificationId) {
        return notificationService.markAsRead(notificationId, SecurityUtils.currentUser().getId());
    }

    @PatchMapping("/read-all")
    public Map<String, String> markAllAsRead() {
        notificationService.markAllAsRead(SecurityUtils.currentUser().getId());
        return Map.of("message", "All notifications marked as read.");
    }

    @DeleteMapping("/{notificationId}")
    public Map<String, String> deleteNotification(@PathVariable String notificationId) {
        notificationService.deleteNotification(notificationId, SecurityUtils.currentUser().getId());
        return Map.of("message", "Notification deleted successfully.");
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public NotificationResponse createNotification(@Valid @RequestBody NotificationCreateRequest request) {
        return notificationService.createNotification(request);
    }
}
