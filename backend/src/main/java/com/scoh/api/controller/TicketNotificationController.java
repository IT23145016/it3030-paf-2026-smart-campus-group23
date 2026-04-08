package com.scoh.api.controller;

import com.scoh.api.dto.NotificationResponse;
import com.scoh.api.dto.TicketNotificationRequest;
import com.scoh.api.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/integrations/tickets")
public class TicketNotificationController {

    private final NotificationService notificationService;

    public TicketNotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/notify")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public NotificationResponse notifyTicketUpdate(@Valid @RequestBody TicketNotificationRequest request) {
        return notificationService.createTicketNotification(request);
    }
}
