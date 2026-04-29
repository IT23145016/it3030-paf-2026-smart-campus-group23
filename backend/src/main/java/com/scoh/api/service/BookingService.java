package com.scoh.api.service;

import com.scoh.api.domain.AvailabilityWindow;
import com.scoh.api.domain.Booking;
import com.scoh.api.domain.BookingStatus;
import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.Role;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.dto.BookingStatusUpdateRequest;
import com.scoh.api.exception.BookingConflictException;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.repository.BookingRepository;
import com.scoh.api.repository.CampusResourceRepository;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class BookingService {
  private final BookingRepository bookingRepository;
  private final CampusResourceRepository resourceRepository;
  private final NotificationService notificationService;

  public BookingService(
    BookingRepository bookingRepository,
    CampusResourceRepository resourceRepository,
    NotificationService notificationService
  ) {
    this.bookingRepository = bookingRepository;
    this.resourceRepository = resourceRepository;
    this.notificationService = notificationService;
  }

  public BookingResponse createBooking(UserAccount currentUser, BookingCreateRequest request) {
    validateBookingRequest(request);

    CampusResource resource = resourceRepository.findById(request.getResourceId())
      .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

    validateResourceCapacity(request.getAttendees(), resource.getCapacity());
    validateResourceAvailability(resource, request.getStartTime(), request.getEndTime());
    checkBookingConflict(request.getResourceId(), request.getStartTime(), request.getEndTime());

    Booking booking = new Booking(
      request.getResourceId(),
      currentUser.getId(),
      request.getPurpose(),
      request.getAttendees(),
      request.getStartTime(),
      request.getEndTime()
    );

    booking = bookingRepository.save(booking);
    notificationService.notifyAdminsNewBooking(booking, currentUser.getFullName() != null ? currentUser.getFullName() : currentUser.getEmail());
    return toResponse(booking);
  }

  public List<BookingResponse> getUserBookings(String userId, String status) {
    if (status == null || status.isBlank()) {
      return getUserBookingsInternal(userId);
    }

    BookingStatus bookingStatus;
    try {
      bookingStatus = BookingStatus.valueOf(status.toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid booking status: " + status);
    }

    return bookingRepository.findByUserIdAndStatus(userId, bookingStatus).stream()
      .sorted(Comparator.comparing(Booking::getUpdatedAt).reversed())
      .map(this::prepareBookingForResponse)
      .map(this::toResponse)
      .collect(Collectors.toList());
  }

  public List<BookingResponse> getUserBookings(String userId, String status, String startDate, String endDate) {
    List<Booking> bookings;

    if (status != null && !status.isBlank()) {
      BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
      bookings = bookingRepository.findByUserIdAndStatus(userId, bookingStatus);
    } else {
      bookings = bookingRepository.findByUserId(userId);
    }

    if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
      try {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
        bookings = bookings.stream()
          .filter(booking -> {
            LocalDateTime bookingStart = booking.getStartTime();
            return bookingStart.isAfter(start.minusSeconds(1)) && bookingStart.isBefore(end.plusSeconds(1));
          })
          .collect(Collectors.toList());
      } catch (Exception e) {
        throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD format.");
      }
    }

    return bookings.stream()
      .sorted(Comparator.comparing(Booking::getUpdatedAt).reversed())
      .map(this::prepareBookingForResponse)
      .map(this::toResponse)
      .collect(Collectors.toList());
  }

  private List<BookingResponse> getUserBookingsInternal(String userId) {
    return bookingRepository.findByUserId(userId).stream()
      .sorted(Comparator.comparing(Booking::getUpdatedAt).reversed())
      .map(this::prepareBookingForResponse)
      .map(this::toResponse)
      .collect(Collectors.toList());
  }

  public BookingResponse getBooking(String bookingId, UserAccount currentUser) {
    Booking booking = bookingRepository.findById(bookingId)
      .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    if (!booking.getUserId().equals(currentUser.getId()) && !currentUser.getRoles().contains(Role.ADMIN)) {
      throw new ForbiddenOperationException("You can only view your own bookings");
    }

    return toResponse(prepareBookingForResponse(booking));
  }

  public List<BookingResponse> getAllBookings() {
    return getAllBookings(null, null, null, null, null);
  }

  public List<BookingResponse> getAllBookings(String status, String userId, String resourceId, String startDate, String endDate) {
    List<Booking> bookings = bookingRepository.findAll();

    if (status != null && !status.isBlank()) {
      BookingStatus bookingStatus;
      try {
        bookingStatus = BookingStatus.valueOf(status.toUpperCase());
      } catch (IllegalArgumentException e) {
        throw new IllegalArgumentException("Invalid booking status: " + status);
      }
      bookings = bookings.stream()
        .filter(booking -> booking.getStatus() == bookingStatus)
        .collect(Collectors.toList());
    }

    if (userId != null && !userId.isBlank()) {
      bookings = bookings.stream()
        .filter(booking -> booking.getUserId().equals(userId))
        .collect(Collectors.toList());
    }

    if (resourceId != null && !resourceId.isBlank()) {
      bookings = bookings.stream()
        .filter(booking -> booking.getResourceId().equals(resourceId))
        .collect(Collectors.toList());
    }

    if ((startDate != null && !startDate.isBlank()) || (endDate != null && !endDate.isBlank())) {
      if (startDate == null || startDate.isBlank() || endDate == null || endDate.isBlank()) {
        throw new IllegalArgumentException("Both startDate and endDate are required for date range filtering.");
      }
      try {
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
        bookings = bookings.stream()
          .filter(booking -> {
            LocalDateTime bookingStart = booking.getStartTime();
            return bookingStart.isAfter(start.minusSeconds(1)) && bookingStart.isBefore(end.plusSeconds(1));
          })
          .collect(Collectors.toList());
      } catch (Exception e) {
        throw new IllegalArgumentException("Invalid date format. Use YYYY-MM-DD format.");
      }
    }

    return bookings.stream()
      .sorted(Comparator.comparing(Booking::getUpdatedAt).reversed())
      .map(this::prepareBookingForResponse)
      .map(this::toResponse)
      .collect(Collectors.toList());
  }

  public List<BookingResponse> getPendingBookings() {
    return bookingRepository.findByStatus(BookingStatus.PENDING).stream()
      .sorted(Comparator.comparing(Booking::getUpdatedAt).reversed())
      .map(this::prepareBookingForResponse)
      .map(this::toResponse)
      .collect(Collectors.toList());
  }

  public BookingResponse updateBookingStatus(String bookingId, BookingStatusUpdateRequest request) {
    Booking booking = bookingRepository.findById(bookingId)
      .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    BookingStatus newStatus;
    try {
      newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException("Invalid booking status: " + request.getStatus());
    }

    if (booking.getStatus() == BookingStatus.PENDING) {
      if (newStatus != BookingStatus.APPROVED && newStatus != BookingStatus.REJECTED) {
        throw new IllegalArgumentException("Pending bookings can only be approved or rejected");
      }
    } else if (booking.getStatus() == BookingStatus.APPROVED) {
      if (newStatus != BookingStatus.CANCELLED) {
        throw new IllegalArgumentException("Approved bookings can only be cancelled");
      }
    } else {
      throw new IllegalArgumentException("Cannot change status of " + booking.getStatus() + " bookings");
    }

    booking.setStatus(newStatus);
    booking.setAdminNotes(request.getAdminNotes());
    if (newStatus == BookingStatus.APPROVED && (booking.getCheckInToken() == null || booking.getCheckInToken().isBlank())) {
      booking.setCheckInToken(generateCheckInToken());
    }
    booking.setUpdatedAt(LocalDateTime.now());
    booking = bookingRepository.save(booking);

    createStatusNotification(booking, newStatus);
    return toResponse(prepareBookingForResponse(booking));
  }

  public BookingResponse verifyCheckInToken(String checkInToken) {
    Booking booking = findBookingByCheckInToken(checkInToken);
    validateCheckInAvailability(booking);
    return toResponse(prepareBookingForResponse(booking));
  }

  public BookingResponse confirmCheckIn(String checkInToken, UserAccount currentUser) {
    Booking booking = findBookingByCheckInToken(checkInToken);
    validateCheckInAvailability(booking);

    if (booking.getCheckedInAt() == null) {
      booking.setCheckedInAt(LocalDateTime.now());
      booking.setCheckedInBy(resolveCheckInActor(currentUser));
      booking.setUpdatedAt(LocalDateTime.now());
      booking = bookingRepository.save(booking);
    }

    return toResponse(prepareBookingForResponse(booking));
  }

  public BookingResponse cancelBooking(String bookingId, String userId) {
    Booking booking = bookingRepository.findById(bookingId)
      .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

    if (!booking.getUserId().equals(userId)) {
      throw new ForbiddenOperationException("You can only cancel your own bookings");
    }

    if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.REJECTED) {
      throw new IllegalArgumentException("Booking is already closed");
    }

    if (booking.getStatus() != BookingStatus.APPROVED && booking.getStatus() != BookingStatus.PENDING) {
      throw new IllegalArgumentException("Only pending or approved bookings can be cancelled");
    }

    booking.setStatus(BookingStatus.CANCELLED);
    booking.setUpdatedAt(LocalDateTime.now());
    booking = bookingRepository.save(booking);

    return toResponse(prepareBookingForResponse(booking));
  }

  private void validateBookingRequest(BookingCreateRequest request) {
    if (request.getStartTime() == null || request.getEndTime() == null) {
      throw new IllegalArgumentException("Booking start and end times are required");
    }
    if (request.getStartTime().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("Booking start time must be in the future");
    }
    if (request.getEndTime().isBefore(request.getStartTime()) || request.getEndTime().isEqual(request.getStartTime())) {
      throw new IllegalArgumentException("Booking end time must be after start time");
    }
    if (request.getAttendees() == null || request.getAttendees() < 1) {
      throw new IllegalArgumentException("Number of attendees must be at least 1");
    }
  }

  private void validateResourceCapacity(Integer attendees, Integer capacity) {
    if (attendees > capacity) {
      throw new IllegalArgumentException("Number of attendees exceeds resource capacity");
    }
  }

  private void validateResourceAvailability(CampusResource resource, LocalDateTime startTime, LocalDateTime endTime) {
    if (resource.getAvailabilityWindows() == null || resource.getAvailabilityWindows().isEmpty()) {
      throw new IllegalArgumentException("This resource does not have any availability windows configured");
    }

    if (!startTime.toLocalDate().equals(endTime.toLocalDate())) {
      throw new IllegalArgumentException("Bookings must start and end on the same day");
    }

    String bookingDay = startTime.getDayOfWeek().name();
    LocalTime bookingStart = startTime.toLocalTime();
    LocalTime bookingEnd = endTime.toLocalTime();

    boolean withinAvailability = resource.getAvailabilityWindows().stream()
      .filter(window -> bookingDay.equalsIgnoreCase(window.getDayOfWeek()))
      .anyMatch(window -> isWithinWindow(window, bookingStart, bookingEnd));

    if (!withinAvailability) {
      String availableWindows = resource.getAvailabilityWindows().stream()
        .filter(window -> bookingDay.equalsIgnoreCase(window.getDayOfWeek()))
        .map(window -> window.getStartTime() + " - " + window.getEndTime())
        .collect(Collectors.joining(", "));

      if (availableWindows.isBlank()) {
        throw new IllegalArgumentException("This resource is not available on " + formatDayName(bookingDay));
      }

      throw new IllegalArgumentException(
        "Booking must be within the resource availability on " + formatDayName(bookingDay) + ": " + availableWindows
      );
    }
  }

  private boolean isWithinWindow(AvailabilityWindow window, LocalTime bookingStart, LocalTime bookingEnd) {
    LocalTime windowStart = LocalTime.parse(window.getStartTime());
    LocalTime windowEnd = LocalTime.parse(window.getEndTime());
    return !bookingStart.isBefore(windowStart) && !bookingEnd.isAfter(windowEnd);
  }

  private String formatDayName(String dayName) {
    DayOfWeek dayOfWeek = DayOfWeek.valueOf(dayName.toUpperCase());
    String normalized = dayOfWeek.name().toLowerCase();
    return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
  }

  private void checkBookingConflict(String resourceId, LocalDateTime startTime, LocalDateTime endTime) {
    List<Booking> conflictingBookings = bookingRepository.findByResourceIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
      resourceId,
      List.of(BookingStatus.PENDING, BookingStatus.APPROVED),
      endTime,
      startTime
    );

    if (!conflictingBookings.isEmpty()) {
      Booking conflict = conflictingBookings.get(0);
      throw new BookingConflictException(
        String.format(
          "Resource is already reserved from %s to %s",
          conflict.getStartTime(),
          conflict.getEndTime()
        )
      );
    }
  }

  private void createStatusNotification(Booking booking, BookingStatus status) {
    if (status == BookingStatus.APPROVED) {
      notificationService.createBookingDecisionNotification(booking, true);
    } else if (status == BookingStatus.REJECTED) {
      notificationService.createBookingDecisionNotification(booking, false);
    }
  }

  private BookingResponse toResponse(Booking booking) {
    return new BookingResponse(
      booking.getId(),
      booking.getResourceId(),
      booking.getUserId(),
      booking.getPurpose(),
      booking.getAttendees(),
      booking.getStartTime(),
      booking.getEndTime(),
      booking.getStatus(),
      booking.getCreatedAt(),
      booking.getUpdatedAt(),
      booking.getAdminNotes(),
      booking.getCheckInToken(),
      booking.getCheckedInAt(),
      booking.getCheckedInBy()
    );
  }

  private Booking prepareBookingForResponse(Booking booking) {
    if (booking.getStatus() == BookingStatus.APPROVED && (booking.getCheckInToken() == null || booking.getCheckInToken().isBlank())) {
      booking.setCheckInToken(generateCheckInToken());
      booking.setUpdatedAt(LocalDateTime.now());
      return bookingRepository.save(booking);
    }

    return booking;
  }

  private Booking findBookingByCheckInToken(String checkInToken) {
    if (checkInToken == null || checkInToken.isBlank()) {
      throw new IllegalArgumentException("Check-in token is required");
    }

    return bookingRepository.findByCheckInToken(checkInToken)
      .orElseThrow(() -> new IllegalArgumentException("Booking check-in token is invalid"));
  }

  private void validateCheckInAvailability(Booking booking) {
    if (booking.getStatus() != BookingStatus.APPROVED) {
      throw new IllegalArgumentException("Only approved bookings can be checked in");
    }
  }

  private String resolveCheckInActor(UserAccount currentUser) {
    if (currentUser.getFullName() != null && !currentUser.getFullName().isBlank()) {
      return currentUser.getFullName();
    }
    return currentUser.getEmail();
  }

  private String generateCheckInToken() {
    return UUID.randomUUID().toString();
  }
}
