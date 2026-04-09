package com.scoh.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

import com.scoh.api.domain.Booking;
import com.scoh.api.domain.BookingStatus;
import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.AvailabilityWindow;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.dto.BookingStatusUpdateRequest;
import com.scoh.api.exception.BookingConflictException;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.repository.BookingRepository;
import com.scoh.api.repository.CampusResourceRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private CampusResourceRepository campusResourceRepository;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void shouldCreatePendingBookingWhenRequestIsValid() {
        BookingCreateRequest request = validCreateRequest();
        CampusResource resource = activeResource("resource-1", 80);

        when(campusResourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                any(), any(), any(), any())).thenReturn(List.of());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId("booking-1");
            return booking;
        });

        BookingResponse response = bookingService.createBooking("user-1", request);

        assertThat(response.getId()).isEqualTo("booking-1");
        assertThat(response.getStatus()).isEqualTo(BookingStatus.PENDING);
        assertThat(response.getResourceId()).isEqualTo("resource-1");
        assertThat(response.getUserId()).isEqualTo("user-1");
    }

    @Test
    void shouldRejectBookingWhenResourceHasConflict() {
        BookingCreateRequest request = validCreateRequest();
        CampusResource resource = activeResource("resource-1", 80);
        Booking existing = new Booking(
                "resource-1",
                "user-2",
                "Existing booking",
                15,
                request.getStartTime().plusMinutes(15),
                request.getEndTime().minusMinutes(15));

        when(campusResourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));
        when(bookingRepository.findByResourceIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
                any(), any(), any(), any())).thenReturn(List.of(existing));

        assertThatThrownBy(() -> bookingService.createBooking("user-1", request))
                .isInstanceOf(BookingConflictException.class)
                .hasMessageContaining("already reserved");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldRejectBookingWhenAttendeesExceedCapacity() {
        BookingCreateRequest request = validCreateRequest();
        request.setAttendees(120);
        CampusResource resource = activeResource("resource-1", 40);

        when(campusResourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));

        assertThatThrownBy(() -> bookingService.createBooking("user-1", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exceeds resource capacity");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldRejectBookingOutsideAvailabilityWindow() {
        BookingCreateRequest request = validCreateRequest();
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(18).withMinute(0).withSecond(0).withNano(0));
        request.setEndTime(LocalDateTime.now().plusDays(1).withHour(19).withMinute(0).withSecond(0).withNano(0));
        CampusResource resource = activeResource("resource-1", 80);

        when(campusResourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));

        assertThatThrownBy(() -> bookingService.createBooking("user-1", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Booking must be within the resource availability");

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void shouldApprovePendingBookingAndNotifyUser() {
        Booking booking = existingBooking("booking-1", "resource-1", "user-1", BookingStatus.PENDING);
        BookingStatusUpdateRequest request = new BookingStatusUpdateRequest();
        request.setStatus("APPROVED");
        request.setAdminNotes("Approved for the lecture.");

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.updateBookingStatus("booking-1", request);

        assertThat(response.getStatus()).isEqualTo(BookingStatus.APPROVED);
        assertThat(response.getAdminNotes()).isEqualTo("Approved for the lecture.");
    }

    @Test
    void shouldCancelOwnApprovedBookingAndNotifyUser() {
        Booking booking = existingBooking("booking-1", "resource-1", "user-1", BookingStatus.APPROVED);

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse response = bookingService.cancelBooking("booking-1", "user-1");

        assertThat(response.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void shouldPreventCancellingAnotherUsersBooking() {
        Booking booking = existingBooking("booking-1", "resource-1", "owner-1", BookingStatus.PENDING);

        when(bookingRepository.findById("booking-1")).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking("booking-1", "user-2"))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("own bookings");
    }

    private BookingCreateRequest validCreateRequest() {
        BookingCreateRequest request = new BookingCreateRequest();
        request.setResourceId("resource-1");
        request.setPurpose("Frameworks lecture");
        request.setAttendees(35);
        request.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0));
        request.setEndTime(LocalDateTime.now().plusDays(1).withHour(12).withMinute(0).withSecond(0).withNano(0));
        return request;
    }

    private CampusResource activeResource(String resourceId, int capacity) {
        CampusResource resource = new CampusResource();
        resource.setId(resourceId);
        resource.setCapacity(capacity);
        AvailabilityWindow availabilityWindow = new AvailabilityWindow();
        availabilityWindow.setDayOfWeek(LocalDateTime.now().plusDays(1).getDayOfWeek().name());
        availabilityWindow.setStartTime("08:00");
        availabilityWindow.setEndTime("17:00");
        resource.setAvailabilityWindows(List.of(availabilityWindow));
        return resource;
    }

    private Booking existingBooking(String bookingId, String resourceId, String userId, BookingStatus status) {
        Booking booking = new Booking(
                resourceId,
                userId,
                "Frameworks session",
                30,
                LocalDateTime.now().plusDays(2).withHour(9).withMinute(0).withSecond(0).withNano(0),
                LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0));
        booking.setId(bookingId);
        booking.setStatus(status);
        return booking;
    }
}
