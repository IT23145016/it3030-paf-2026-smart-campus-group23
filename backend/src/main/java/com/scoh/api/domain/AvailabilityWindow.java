package com.scoh.api.domain;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AvailabilityWindow {

    @NotBlank(message = "Availability day is required.")
    private String dayOfWeek;

    @NotBlank(message = "Opening time is required.")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Opening time must use HH:mm format.")
    private String startTime;

    @NotBlank(message = "Closing time is required.")
    @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "Closing time must use HH:mm format.")
    private String endTime;

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }
}
