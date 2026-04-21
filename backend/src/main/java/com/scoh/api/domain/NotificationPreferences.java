package com.scoh.api.domain;

public class NotificationPreferences {

    private boolean bookingDecisionsEnabled = true;
    private boolean ticketStatusChangesEnabled = true;
    private boolean ticketCommentsEnabled = true;

    public boolean isBookingDecisionsEnabled() {
        return bookingDecisionsEnabled;
    }

    public void setBookingDecisionsEnabled(boolean bookingDecisionsEnabled) {
        this.bookingDecisionsEnabled = bookingDecisionsEnabled;
    }

    public boolean isTicketStatusChangesEnabled() {
        return ticketStatusChangesEnabled;
    }

    public void setTicketStatusChangesEnabled(boolean ticketStatusChangesEnabled) {
        this.ticketStatusChangesEnabled = ticketStatusChangesEnabled;
    }

    public boolean isTicketCommentsEnabled() {
        return ticketCommentsEnabled;
    }

    public void setTicketCommentsEnabled(boolean ticketCommentsEnabled) {
        this.ticketCommentsEnabled = ticketCommentsEnabled;
    }
}
