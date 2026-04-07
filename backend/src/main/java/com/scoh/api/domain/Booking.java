package com.scoh.api.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "bookings")
public class Booking {
  @Id
  private String id;
  private String resourceId;
  private String userId;
  private String purpose;
  private Integer attendees;
  private LocalDateTime startTime;
  private LocalDateTime endTime;
  private BookingStatus status;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private String adminNotes;

  public Booking() {}

  public Booking(String resourceId, String userId, String purpose, Integer attendees, LocalDateTime startTime, LocalDateTime endTime) {
    this.resourceId = resourceId;
    this.userId = userId;
    this.purpose = purpose;
    this.attendees = attendees;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = BookingStatus.PENDING;
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getResourceId() {
    return resourceId;
  }

  public void setResourceId(String resourceId) {
    this.resourceId = resourceId;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getPurpose() {
    return purpose;
  }

  public void setPurpose(String purpose) {
    this.purpose = purpose;
  }

  public Integer getAttendees() {
    return attendees;
  }

  public void setAttendees(Integer attendees) {
    this.attendees = attendees;
  }

  public LocalDateTime getStartTime() {
    return startTime;
  }

  public void setStartTime(LocalDateTime startTime) {
    this.startTime = startTime;
  }

  public LocalDateTime getEndTime() {
    return endTime;
  }

  public void setEndTime(LocalDateTime endTime) {
    this.endTime = endTime;
  }

  public BookingStatus getStatus() {
    return status;
  }

  public void setStatus(BookingStatus status) {
    this.status = status;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  public String getAdminNotes() {
    return adminNotes;
  }

  public void setAdminNotes(String adminNotes) {
    this.adminNotes = adminNotes;
  }
}
