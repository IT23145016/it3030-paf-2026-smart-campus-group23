package com.scoh.api.service;

import com.scoh.api.domain.Notification;
import com.scoh.api.domain.Booking;
import com.scoh.api.domain.NotificationType;
import com.scoh.api.domain.IncidentTicket;
import com.scoh.api.domain.Role;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.NotificationCreateRequest;
import com.scoh.api.dto.NotificationResponse;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.NotificationRepository;
import com.scoh.api.repository.UserAccountRepository;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserAccountRepository userAccountRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserAccountRepository userAccountRepository) {
        this.notificationRepository = notificationRepository;
        this.userAccountRepository = userAccountRepository;
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

    public void notifyAdminsNewBooking(Booking booking, String requesterName) {
        userAccountRepository.findAll().stream()
                .filter(user -> user.isActive() && user.getRoles().contains(Role.ADMIN))
                .forEach(admin -> createNotification(new NotificationCreateRequest(
                        admin.getId(),
                        NotificationType.BOOKING_CREATED,
                        "New booking request",
                        requesterName + " submitted a new booking request.",
                        "/admin/bookings",
                        Map.of("bookingId", booking.getId()))));
    }

    public void notifyAdminsNewTicket(IncidentTicket ticket, String submitterName) {
        userAccountRepository.findAll().stream()
                .filter(user -> user.isActive() && user.getRoles().contains(Role.ADMIN))
                .forEach(admin -> createNotification(new NotificationCreateRequest(
                        admin.getId(),
                        NotificationType.TICKET_CREATED,
                        "New incident ticket",
                        submitterName + " submitted a new ticket: \"" + ticket.getTitle() + "\".",
                        "/tickets/manage?ticketId=" + ticket.getId(),
                        Map.of("ticketId", ticket.getId()))));
    }

    public void createBookingDecisionNotification(Booking booking, boolean approved) {
        NotificationType type = approved ? NotificationType.BOOKING_APPROVED : NotificationType.BOOKING_REJECTED;
        if (!isNotificationEnabled(booking.getUserId(), type)) {
            return;
        }
        createNotification(new NotificationCreateRequest(
                booking.getUserId(),
                type,
                approved ? "Booking approved" : "Booking rejected",
                approved
                        ? "Your booking request has been approved."
                        : "Your booking request was rejected.",
                "/bookings?bookingId=" + booking.getId(),
                Map.of("bookingId", booking.getId(), "status", booking.getStatus().toString())));
    }

    public void createTicketStatusNotification(
            IncidentTicket ticket,
            String recipientUserId,
            String previousStatus,
            String nextStatus) {
        if (!isNotificationEnabled(recipientUserId, NotificationType.TICKET_STATUS_CHANGED)) {
            return;
        }
        createNotification(new NotificationCreateRequest(
                recipientUserId,
                NotificationType.TICKET_STATUS_CHANGED,
                "Ticket status updated",
                "Ticket \"" + ticket.getTitle() + "\" moved from " + previousStatus + " to " + nextStatus + ".",
                resolveTicketTargetUrl(recipientUserId, ticket.getId()),
                Map.of(
                        "ticketId", ticket.getId(),
                        "previousStatus", previousStatus,
                        "status", nextStatus)));
    }

    public void createTicketCommentNotification(
            IncidentTicket ticket,
            String recipientUserId,
            String commenterName) {
        if (!isNotificationEnabled(recipientUserId, NotificationType.TICKET_COMMENT_ADDED)) {
            return;
        }
        createNotification(new NotificationCreateRequest(
                recipientUserId,
                NotificationType.TICKET_COMMENT_ADDED,
                "New comment on your ticket",
                commenterName + " added a comment to ticket \"" + ticket.getTitle() + "\".",
                resolveTicketTargetUrl(recipientUserId, ticket.getId()),
                Map.of("ticketId", ticket.getId())));
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

    private boolean isNotificationEnabled(String userId, NotificationType type) {
        UserAccount user = userAccountRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }

        return switch (type) {
            case BOOKING_APPROVED, BOOKING_REJECTED -> user.getNotificationPreferences().isBookingDecisionsEnabled();
            case TICKET_STATUS_CHANGED -> user.getNotificationPreferences().isTicketStatusChangesEnabled();
            case TICKET_COMMENT_ADDED -> user.getNotificationPreferences().isTicketCommentsEnabled();
            default -> true;
        };
    }

    private String resolveTicketTargetUrl(String userId, String ticketId) {
        UserAccount user = userAccountRepository.findById(userId).orElse(null);
        if (user != null && (user.getRoles().contains(Role.ADMIN) || user.getRoles().contains(Role.TECHNICIAN))) {
            return "/tickets/manage?ticketId=" + ticketId;
        }
        return "/tickets?ticketId=" + ticketId;
    }
}
