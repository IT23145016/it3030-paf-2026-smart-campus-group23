package com.scoh.api.service;

import com.scoh.api.domain.Notification;
import com.scoh.api.domain.NotificationType;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.NotificationCreateRequest;
import com.scoh.api.dto.NotificationResponse;
import com.scoh.api.dto.TicketNotificationRequest;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.NotificationRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationResponse createNotification(NotificationCreateRequest request) {
        Notification notification = new Notification();
        notification.setRecipientUserId(request.recipientUserId());
        notification.setType(request.type());
        notification.setTitle(request.title());
        notification.setMessage(request.message());
        notification.setTargetUrl(request.targetUrl());
        notification.setMetadata(request.metadata());
        notification.setRead(false);
        return toResponse(notificationRepository.save(notification));
    }

    public NotificationResponse createTicketNotification(TicketNotificationRequest request) {
        if (request.type() != NotificationType.TICKET_STATUS_CHANGED
                && request.type() != NotificationType.TICKET_COMMENT_ADDED) {
            throw new IllegalArgumentException("Ticket notifications must use a ticket-related notification type.");
        }

        return createNotification(new NotificationCreateRequest(
                request.recipientUserId(),
                request.type(),
                request.title(),
                request.message(),
                request.targetUrl() != null && !request.targetUrl().isBlank()
                        ? request.targetUrl()
                        : "/tickets/" + request.ticketId(),
                request.metadata()));
    }

    public void createRoleUpdateNotification(UserAccount user) {
        Notification notification = new Notification();
        notification.setRecipientUserId(user.getId());
        notification.setType(NotificationType.ROLE_UPDATED);
        notification.setTitle("Your access level changed");
        notification.setMessage("Your roles were updated to: " + user.getRoles());
        notification.setMetadata(Map.of("roles", user.getRoles()));
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public void createAccountCreatedNotification(UserAccount user) {
        createSystemNotification(
                user.getId(),
                "Account created",
                "An administrator created your account with roles: " + user.getRoles(),
                Map.of("roles", user.getRoles(), "active", user.isActive()),
                "/bookings#notifications");
    }

    public void createAccountStatusNotification(UserAccount user) {
        createSystemNotification(
                user.getId(),
                user.isActive() ? "Account activated" : "Account deactivated",
                user.isActive()
                        ? "Your account has been activated by an administrator."
                        : "Your account has been deactivated by an administrator.",
                Map.of("active", user.isActive()),
                "/bookings#notifications");
    }

    public void createAdminAuditNotification(String adminUserId, String title, String message, Map<String, Object> metadata) {
        createSystemNotification(adminUserId, title, message, metadata, "/admin/roles#notifications");
    }

    private void createSystemNotification(
            String recipientUserId,
            String title,
            String message,
            Map<String, Object> metadata,
            String targetUrl) {
        Notification notification = new Notification();
        notification.setRecipientUserId(recipientUserId);
        notification.setType(NotificationType.SYSTEM);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setTargetUrl(targetUrl);
        notification.setMetadata(metadata);
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotificationsForUser(String userId) {
        return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
    }

    public NotificationResponse markAsRead(String notificationId, String userId) {
        Notification notification = findOwnedNotification(notificationId, userId);
        notification.setRead(true);
        return toResponse(notificationRepository.save(notification));
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId);
        notifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    public void deleteNotification(String notificationId, String userId) {
        Notification notification = findOwnedNotification(notificationId, userId);
        notificationRepository.delete(notification);
    }

    private Notification findOwnedNotification(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found: " + notificationId));
        if (!notification.getRecipientUserId().equals(userId)) {
            throw new ForbiddenOperationException("You cannot modify another user's notification.");
        }
        return notification;
    }

    private NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getTargetUrl(),
                notification.getMetadata(),
                notification.getCreatedAt());
    }
}
