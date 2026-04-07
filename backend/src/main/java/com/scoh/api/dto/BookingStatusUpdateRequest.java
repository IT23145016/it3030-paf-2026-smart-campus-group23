package com.scoh.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class BookingStatusUpdateRequest {
  @NotBlank(message = "Status is required")
  private String status;

  @Size(max = 500, message = "Admin notes must be 500 characters or fewer")
  private String adminNotes;

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public String getAdminNotes() {
    return adminNotes;
  }

  public void setAdminNotes(String adminNotes) {
    this.adminNotes = adminNotes;
  }
}
