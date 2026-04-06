package com.scoh.api.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class BookingCreateRequest {
  @NotBlank(message = "Resource ID is required")
  private String resourceId;

  @NotBlank(message = "Purpose is required")
  @Size(max = 500, message = "Purpose must be 500 characters or fewer")
  private String purpose;

  @NotNull(message = "Number of attendees is required")
  @Min(value = 1, message = "Number of attendees must be at least 1")
  private Integer attendees;

  @NotNull(message = "Booking start time is required")
  @Future(message = "Booking start time must be in the future")
  private LocalDateTime startTime;

  @NotNull(message = "Booking end time is required")
  @Future(message = "Booking end time must be in the future")
  private LocalDateTime endTime;

  public String getResourceId() {
    return resourceId;
  }

  public void setResourceId(String resourceId) {
    this.resourceId = resourceId;
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
}
