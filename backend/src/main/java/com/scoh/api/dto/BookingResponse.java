package com.scoh.api.dto;

import com.scoh.api.domain.BookingStatus;
import java.time.LocalDateTime;

public class BookingResponse {
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
  private String checkInToken;
  private LocalDateTime checkedInAt;
  private String checkedInBy;

  public BookingResponse() {}

  public BookingResponse(String id, String resourceId, String userId, String purpose, Integer attendees, LocalDateTime startTime, LocalDateTime endTime, BookingStatus status, LocalDateTime createdAt, LocalDateTime updatedAt, String adminNotes, String checkInToken, LocalDateTime checkedInAt, String checkedInBy) {
    this.id = id;
    this.resourceId = resourceId;
    this.userId = userId;
    this.purpose = purpose;
    this.attendees = attendees;
    this.startTime = startTime;
    this.endTime = endTime;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.adminNotes = adminNotes;
    this.checkInToken = checkInToken;
    this.checkedInAt = checkedInAt;
    this.checkedInBy = checkedInBy;
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

  public String getCheckInToken() {
    return checkInToken;
  }

  public void setCheckInToken(String checkInToken) {
    this.checkInToken = checkInToken;
  }

  public LocalDateTime getCheckedInAt() {
    return checkedInAt;
  }

  public void setCheckedInAt(LocalDateTime checkedInAt) {
    this.checkedInAt = checkedInAt;
  }

  public String getCheckedInBy() {
    return checkedInBy;
  }

  public void setCheckedInBy(String checkedInBy) {
    this.checkedInBy = checkedInBy;
  }
}
