package com.scoh.api.controller;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.dto.BookingStatusUpdateRequest;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {
  private final BookingService bookingService;

  public BookingController(BookingService bookingService) {
    this.bookingService = bookingService;
  }

  @PostMapping
  public ResponseEntity<BookingResponse> createBooking(@RequestBody BookingCreateRequest request) {
    UserAccount user = SecurityUtils.currentUser();
    BookingResponse response = bookingService.createBooking(user.getId(), request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @GetMapping
  public ResponseEntity<List<BookingResponse>> getUserBookings(@RequestParam(required = false) String status) {
    UserAccount user = SecurityUtils.currentUser();
    List<BookingResponse> bookings = bookingService.getUserBookings(user.getId(), status);
    return ResponseEntity.ok(bookings);
  }

  @GetMapping("/{bookingId}")
  public ResponseEntity<BookingResponse> getBookingById(@PathVariable String bookingId) {
    UserAccount user = SecurityUtils.currentUser();
    BookingResponse response = bookingService.getBooking(bookingId, user.getId());
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
  public ResponseEntity<List<BookingResponse>> getAllBookings() {
    List<BookingResponse> bookings = bookingService.getAllBookings();
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
    @RequestBody BookingStatusUpdateRequest request
  ) {
    BookingResponse response = bookingService.updateBookingStatus(bookingId, request);
    return ResponseEntity.ok(response);
  }
}

