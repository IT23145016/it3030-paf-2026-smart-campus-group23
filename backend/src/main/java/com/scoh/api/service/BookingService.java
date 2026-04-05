package com.scoh.api.service;

import com.scoh.api.domain.Booking;
import com.scoh.api.domain.BookingStatus;
import com.scoh.api.domain.CampusResource;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.repository.BookingRepository;
import com.scoh.api.repository.CampusResourceRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
public class BookingService {
  private final BookingRepository bookingRepository;
  private final CampusResourceRepository resourceRepository;

  public BookingService(BookingRepository bookingRepository, CampusResourceRepository resourceRepository) {
    this.bookingRepository = bookingRepository;
    this.resourceRepository = resourceRepository;
  }

  public BookingResponse createBooking(String userId, BookingCreateRequest request) {
    if (request.getStartTime().isBefore(LocalDateTime.now())) {
      throw new IllegalArgumentException("Booking start time must be in the future");
    }

    if (request.getEndTime().isBefore(request.getStartTime())) {
      throw new IllegalArgumentException("Booking end time must be after start time");
    }

    if (request.getAttendees() == null || request.getAttendees() < 1) {
      throw new IllegalArgumentException("Number of attendees must be at least 1");
    }

    CampusResource resource = resourceRepository.findById(request.getResourceId())
      .orElseThrow(() -> new IllegalArgumentException("Resource not found"));

    if (request.getAttendees() > resource.getCapacity()) {
      throw new IllegalArgumentException("Number of attendees exceeds resource capacity");
    }

    Booking booking = new Booking(
      request.getResourceId(),
      userId,
      request.getPurpose(),
      request.getAttendees(),
      request.getStartTime(),
      request.getEndTime()
    );

    booking = bookingRepository.save(booking);
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
      booking.getAdminNotes()
    );
  }

  public java.util.List<BookingResponse> getUserBookings(String userId) {
    return bookingRepository.findByUserId(userId)
      .stream()
      .map(this::toResponse)
      .collect(Collectors.toList());
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
      booking.getAdminNotes()
    );
  }
}
