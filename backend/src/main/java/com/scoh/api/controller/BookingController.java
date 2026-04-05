package com.scoh.api.controller;

import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.BookingCreateRequest;
import com.scoh.api.dto.BookingResponse;
import com.scoh.api.service.BookingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
  public ResponseEntity<BookingResponse> createBooking(
    @AuthenticationPrincipal UserAccount user,
    @RequestBody BookingCreateRequest request
  ) {
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    try {
      BookingResponse response = bookingService.createBooking(user.getId(), request);
      return ResponseEntity.status(HttpStatus.CREATED).body(response);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
  }

  @GetMapping
  public ResponseEntity<List<BookingResponse>> getUserBookings(
    @AuthenticationPrincipal UserAccount user
  ) {
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    List<BookingResponse> bookings = bookingService.getUserBookings(user.getId());
    return ResponseEntity.ok(bookings);
  }
}
