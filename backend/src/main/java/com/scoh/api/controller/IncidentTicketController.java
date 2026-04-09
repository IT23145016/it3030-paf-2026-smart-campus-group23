package com.scoh.api.controller;

import com.scoh.api.domain.TicketPriority;
import com.scoh.api.domain.TicketStatus;
import com.scoh.api.dto.TechnicianUpdateCreateRequest;
import com.scoh.api.dto.TicketAssignmentRequest;
import com.scoh.api.dto.TicketAttachmentResponse;
import com.scoh.api.dto.TicketCreateRequest;
import com.scoh.api.dto.TicketEditRequest;
import com.scoh.api.dto.TicketResponse;
import com.scoh.api.dto.TicketStatusUpdateRequest;
import com.scoh.api.dto.TicketUpdateEditRequest;
import com.scoh.api.dto.TicketUpdateResponse;
import com.scoh.api.security.SecurityUtils;
import com.scoh.api.service.IncidentTicketService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
@RestController
@RequestMapping("/api/tickets")
public class IncidentTicketController {

    private final IncidentTicketService incidentTicketService;

    public IncidentTicketController(IncidentTicketService incidentTicketService) {
        this.incidentTicketService = incidentTicketService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse createTicket(@Valid @RequestBody TicketCreateRequest request) {
        return incidentTicketService.createTicket(request, SecurityUtils.currentUser());
    }

    @GetMapping
    public List<TicketResponse> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) String location) {
        return incidentTicketService.getTickets(SecurityUtils.currentUser(), status, priority, location);
    }

    @GetMapping("/{ticketId}")
    public TicketResponse getTicket(@PathVariable String ticketId) {
        return incidentTicketService.getTicket(ticketId, SecurityUtils.currentUser());
    }

    @PutMapping("/{ticketId}")
    public TicketResponse editTicket(@PathVariable String ticketId, @Valid @RequestBody TicketEditRequest request) {
        return incidentTicketService.editTicket(ticketId, request, SecurityUtils.currentUser());
    }

    @PatchMapping("/{ticketId}/status")
    public TicketResponse updateStatus(@PathVariable String ticketId, @Valid @RequestBody TicketStatusUpdateRequest request) {
        return incidentTicketService.updateStatus(ticketId, request, SecurityUtils.currentUser());
    }

    @PatchMapping("/{ticketId}/assign")
    public TicketResponse assignTechnician(@PathVariable String ticketId, @Valid @RequestBody TicketAssignmentRequest request) {
        return incidentTicketService.assignTechnician(ticketId, request, SecurityUtils.currentUser());
    }

    @PostMapping("/{ticketId}/updates")
    @ResponseStatus(HttpStatus.CREATED)
    public TicketUpdateResponse addComment(@PathVariable String ticketId, @Valid @RequestBody TechnicianUpdateCreateRequest request) {
        return incidentTicketService.addComment(ticketId, request, SecurityUtils.currentUser());
    }

    @PatchMapping("/{ticketId}/updates/{updateId}")
    public TicketUpdateResponse editComment(
            @PathVariable String ticketId,
            @PathVariable String updateId,
            @Valid @RequestBody TicketUpdateEditRequest request) {
        return incidentTicketService.editComment(ticketId, updateId, request, SecurityUtils.currentUser());
    }

    @DeleteMapping("/{ticketId}/updates/{updateId}")
    public Map<String, String> deleteComment(@PathVariable String ticketId, @PathVariable String updateId) {
        incidentTicketService.deleteComment(ticketId, updateId, SecurityUtils.currentUser());
        return Map.of("message", "Comment deleted successfully.");
    }

    @PostMapping(value = "/{ticketId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public TicketAttachmentResponse addAttachment(@PathVariable String ticketId, @RequestParam("file") MultipartFile file) {
        return incidentTicketService.addAttachment(ticketId, file, SecurityUtils.currentUser());
    }

    @GetMapping("/{ticketId}/attachments")
    public List<TicketAttachmentResponse> getAttachments(@PathVariable String ticketId) {
        return incidentTicketService.getAttachments(ticketId, SecurityUtils.currentUser());
    }

    @GetMapping("/{ticketId}/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable String ticketId, @PathVariable String attachmentId) {
        Resource resource = incidentTicketService.loadAttachment(ticketId, attachmentId, SecurityUtils.currentUser());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{ticketId}")
    public Map<String, String> deleteTicket(@PathVariable String ticketId) {
        incidentTicketService.deleteTicket(ticketId, SecurityUtils.currentUser());
        return Map.of("message", "Ticket deleted successfully.");
    }
}
