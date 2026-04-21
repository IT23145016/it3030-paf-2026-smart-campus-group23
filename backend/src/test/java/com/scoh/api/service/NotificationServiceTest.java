package com.scoh.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.scoh.api.domain.Notification;
import com.scoh.api.domain.NotificationPreferences;
import com.scoh.api.domain.NotificationType;
import com.scoh.api.domain.Booking;
import com.scoh.api.domain.BookingStatus;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.NotificationCreateRequest;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.repository.NotificationRepository;
import com.scoh.api.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void shouldReturnNotificationsForUser() {
        Notification notification = new Notification();
        notification.setId("n1");
        notification.setRecipientUserId("u1");
        notification.setType(NotificationType.TICKET_COMMENT_ADDED);
        notification.setTitle("Comment");
        notification.setMessage("Message");
        notification.setRead(false);

        when(notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc("u1"))
                .thenReturn(List.of(notification));

        assertThat(notificationService.getNotificationsForUser("u1")).hasSize(1);
    }

    @Test
    void shouldRejectReadingOtherUsersNotification() {
        Notification notification = new Notification();
        notification.setId("n1");
        notification.setRecipientUserId("u2");
        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        assertThatThrownBy(() -> notificationService.markAsRead("n1", "u1"))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void shouldCreateNotification() {
        Notification saved = new Notification();
        saved.setId("n1");
        saved.setRecipientUserId("u1");
        saved.setType(NotificationType.TICKET_STATUS_CHANGED);
        saved.setTitle("Hello");
        saved.setMessage("World");
        saved.setMetadata(Map.of("source", "test"));

        when(notificationRepository.save(org.mockito.ArgumentMatchers.any(Notification.class))).thenReturn(saved);

        var result = notificationService.createNotification(new NotificationCreateRequest(
                "u1",
                NotificationType.TICKET_STATUS_CHANGED,
                "Hello",
                "World",
                "/tickets/1",
                Map.of("source", "test")));

        assertThat(result.id()).isEqualTo("n1");
        assertThat(result.type()).isEqualTo(NotificationType.TICKET_STATUS_CHANGED);
    }

    @Test
    void shouldDeleteOwnedNotification() {
        Notification notification = new Notification();
        notification.setId("n1");
        notification.setRecipientUserId("u1");

        when(notificationRepository.findById("n1")).thenReturn(Optional.of(notification));

        notificationService.deleteNotification("n1", "u1");

        verify(notificationRepository).delete(notification);
    }

    @Test
    void shouldSkipBookingNotificationWhenBookingPreferencesDisabled() {
        UserAccount user = new UserAccount();
        user.setId("u1");
        NotificationPreferences preferences = new NotificationPreferences();
        preferences.setBookingDecisionsEnabled(false);
        user.setNotificationPreferences(preferences);

        Booking booking = new Booking(
                "resource-1",
                "u1",
                "Lecture",
                20,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(1).plusHours(2));
        booking.setId("b1");
        booking.setStatus(BookingStatus.APPROVED);

        when(userAccountRepository.findById("u1")).thenReturn(Optional.of(user));

        notificationService.createBookingDecisionNotification(booking, true);

        verify(notificationRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }

    @Test
    void shouldCreateTicketCommentNotificationWhenEnabled() {
        UserAccount user = new UserAccount();
        user.setId("u1");

        when(userAccountRepository.findById("u1")).thenReturn(Optional.of(user));
        when(notificationRepository.save(org.mockito.ArgumentMatchers.any(Notification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var ticket = new com.scoh.api.domain.IncidentTicket();
        ticket.setId("t1");
        ticket.setTitle("Projector issue");

        notificationService.createTicketCommentNotification(ticket, "u1", "Technician Kim");

        verify(notificationRepository).save(org.mockito.ArgumentMatchers.any(Notification.class));
    }
}
