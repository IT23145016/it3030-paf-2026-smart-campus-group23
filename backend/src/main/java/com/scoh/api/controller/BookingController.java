package com.scoh.api.controller;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.dto.BookingStatusUpdateRequest;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @PostMapping
  public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingCreateRequest request) {
    UserAccount user = SecurityUtils.currentUser();
    BookingResponse response = bookingService.createBooking(user.getId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<BookingResponse>> getUserBookings(
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String startDate,
    @RequestParam(required = false) String endDate
  ) {
    UserAccount user = SecurityUtils.currentUser();
    List<BookingResponse> bookings = bookingService.getUserBookings(user.getId(), status, startDate, endDate);
    return ResponseEntity.ok(bookings);
  }

  @GetMapping("/{bookingId}")
  public ResponseEntity<BookingResponse> getBookingById(@PathVariable String bookingId) {
    UserAccount user = SecurityUtils.currentUser();
    BookingResponse response = bookingService.getBooking(bookingId, user);
    return ResponseEntity.ok(response);
  }

  @DeleteMapping("/{bookingId}")
  public ResponseEntity<BookingResponse> cancelBooking(@PathVariable String bookingId) {
    UserAccount user = SecurityUtils.currentUser();
    BookingResponse response = bookingService.cancelBooking(bookingId, user.getId());
    return ResponseEntity.ok(response);
  }

  @GetMapping("/admin")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<List<BookingResponse>> getAllBookings(
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String userId,
    @RequestParam(required = false) String resourceId,
    @RequestParam(required = false) String startDate,
    @RequestParam(required = false) String endDate
  ) {
    List<BookingResponse> bookings = bookingService.getAllBookings(status, userId, resourceId, startDate, endDate);
    return ResponseEntity.ok(bookings);
  }

  @GetMapping("/admin/pending")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<List<BookingResponse>> getPendingBookings() {
    List<BookingResponse> bookings = bookingService.getPendingBookings();
    return ResponseEntity.ok(bookings);
  }

  @PatchMapping("/admin/{bookingId}/status")
  @PreAuthorize("hasRole('ADMIN')")
  public ResponseEntity<BookingResponse> updateBookingStatus(
    @PathVariable String bookingId,
    @Valid @RequestBody BookingStatusUpdateRequest request
  ) {
    BookingResponse response = bookingService.updateBookingStatus(bookingId, request);
    return ResponseEntity.ok(response);
  }
}

