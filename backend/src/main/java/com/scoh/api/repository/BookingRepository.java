package com.scoh.api.repository;

import com.scoh.api.domain.Booking;
import com.scoh.api.domain.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
  List<Booking> findByUserId(String userId);
  List<Booking> findByUserIdAndStatus(String userId, BookingStatus status);
  List<Booking> findByResourceId(String resourceId);
  List<Booking> findByResourceIdAndStatus(String resourceId, BookingStatus status);
  List<Booking> findByStatus(BookingStatus status);
  Optional<Booking> findByCheckInToken(String checkInToken);
  List<Booking> findByResourceIdAndStatusInAndStartTimeBeforeAndEndTimeAfter(
    String resourceId,
    List<BookingStatus> statuses,
    LocalDateTime endTime,
    LocalDateTime startTime
  );
}
