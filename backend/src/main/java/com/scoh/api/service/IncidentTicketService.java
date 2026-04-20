package com.scoh.api.service;

import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.IncidentTicket;
import com.scoh.api.domain.Role;
import com.scoh.api.domain.TicketAttachment;
import com.scoh.api.domain.TicketPriority;
import com.scoh.api.domain.TicketStatus;
import com.scoh.api.domain.TicketUpdate;
import com.scoh.api.domain.UserAccount;
import com.scoh.api.dto.TechnicianUpdateCreateRequest;
import com.scoh.api.dto.TicketAssignmentRequest;
import com.scoh.api.dto.TicketAttachmentResponse;
import com.scoh.api.dto.TicketCreateRequest;
import com.scoh.api.dto.TicketEditRequest;
import com.scoh.api.dto.TicketResponse;
import com.scoh.api.dto.TicketStatusUpdateRequest;
import com.scoh.api.dto.TicketUpdateEditRequest;
import com.scoh.api.dto.TicketUpdateResponse;
import com.scoh.api.exception.ForbiddenOperationException;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.CampusResourceRepository;
import com.scoh.api.repository.IncidentTicketRepository;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class IncidentTicketService {

    private static final List<String> ALLOWED_ATTACHMENT_TYPES = List.of("image/jpeg", "image/png");
    private static final long MAX_ATTACHMENT_SIZE_BYTES = 5L * 1024 * 1024;
    private static final int MAX_ATTACHMENTS_PER_TICKET = 3;

    private final IncidentTicketRepository incidentTicketRepository;
    private final CampusResourceRepository campusResourceRepository;
    private final UserAccountService userAccountService;
    private final Path attachmentRoot;

    public IncidentTicketService(
            IncidentTicketRepository incidentTicketRepository,
            CampusResourceRepository campusResourceRepository,
            UserAccountService userAccountService) {
        this.incidentTicketRepository = incidentTicketRepository;
        this.campusResourceRepository = campusResourceRepository;
        this.userAccountService = userAccountService;
        this.attachmentRoot = Path.of("uploads", "tickets").toAbsolutePath().normalize();
    }

    public TicketResponse createTicket(TicketCreateRequest request, UserAccount currentUser) {
        CampusResource resource = campusResourceRepository.findById(request.resourceId())
                .orElseThrow(() -> new NotFoundException("Resource not found: " + request.resourceId()));

        IncidentTicket ticket = new IncidentTicket();
        ticket.setResourceId(resource.getId());
        ticket.setResourceName(resource.getName());
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setLocation(request.location().trim());
        ticket.setCategory(request.category());
        ticket.setPriority(request.priority());
        ticket.setPreferredContactDetails(request.preferredContactDetails().trim());
        ticket.setStatus(TicketStatus.OPEN);
        ticket.setCreatedByUserId(currentUser.getId());
        ticket.setCreatedByName(currentUser.getFullName());

        IncidentTicket saved = incidentTicketRepository.save(ticket);
        return toResponse(saved);
    }

    public List<TicketResponse> getTickets(UserAccount currentUser, TicketStatus status, TicketPriority priority, String location) {
        Stream<IncidentTicket> stream = incidentTicketRepository.findByDeletedFalseOrderByUpdatedAtDesc().stream();

        if (!hasOperationalAccess(currentUser)) {
            stream = stream.filter(ticket -> ticket.getCreatedByUserId().equals(currentUser.getId()));
        }

        if (status != null) {
            stream = stream.filter(ticket -> ticket.getStatus() == status);
        }
        if (priority != null) {
            stream = stream.filter(ticket -> ticket.getPriority() == priority);
        }
        if (location != null && !location.isBlank()) {
            String normalized = location.trim().toLowerCase();
            stream = stream.filter(ticket -> ticket.getLocation() != null && ticket.getLocation().toLowerCase().contains(normalized));
        }

        return stream
                .sorted(Comparator.comparing(IncidentTicket::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toResponse)
                .toList();
    }

    public TicketResponse getTicket(String ticketId, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);
        return toResponse(ticket);
    }

    public TicketResponse editTicket(String ticketId, TicketEditRequest request, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        if (!ticket.getCreatedByUserId().equals(currentUser.getId()) && !currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("You can only edit your own tickets unless you are an admin.");
        }
        if (ticket.getStatus() != TicketStatus.OPEN && !currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("You can only edit tickets while they are still OPEN.");
        }

        if (request.title() != null && !request.title().isBlank()) {
            ticket.setTitle(request.title().trim());
        }
        if (request.description() != null && !request.description().isBlank()) {
            ticket.setDescription(request.description().trim());
        }
        if (request.location() != null && !request.location().isBlank()) {
            ticket.setLocation(request.location().trim());
        }
        if (request.category() != null) {
            ticket.setCategory(request.category());
        }
        if (request.priority() != null) {
            ticket.setPriority(request.priority());
        }
        if (request.preferredContactDetails() != null && !request.preferredContactDetails().isBlank()) {
            ticket.setPreferredContactDetails(request.preferredContactDetails().trim());
        }

        return toResponse(incidentTicketRepository.save(ticket));
    }

    public TicketResponse updateStatus(String ticketId, TicketStatusUpdateRequest request, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceOperationalWriteAccess(ticket, currentUser);
        validateStatusTransition(ticket, request, currentUser);

        ticket.setStatus(request.status());
        if (request.status() == TicketStatus.REJECTED) {
          ticket.setRejectionReason(request.rejectionReason().trim());
        }
        if (request.status() == TicketStatus.RESOLVED || request.status() == TicketStatus.CLOSED) {
          if (request.resolutionNote() != null && !request.resolutionNote().isBlank()) {
            ticket.setResolutionNotes(request.resolutionNote().trim());
          }
        }

        return toResponse(incidentTicketRepository.save(ticket));
    }

    public TicketResponse assignTechnician(String ticketId, TicketAssignmentRequest request, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        if (!currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("Only admins can assign technicians.");
        }

        UserAccount technician = userAccountService.findById(request.technicianId());
        if (!technician.getRoles().contains(Role.TECHNICIAN)) {
            throw new IllegalArgumentException("Assigned user must have the TECHNICIAN role.");
        }

        ticket.setAssignedToUserId(technician.getId());
        ticket.setAssignedToName(technician.getFullName());
        return toResponse(incidentTicketRepository.save(ticket));
    }

    public TicketUpdateResponse addComment(String ticketId, TechnicianUpdateCreateRequest request, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);

        TicketUpdate update = new TicketUpdate();
        update.setId(UUID.randomUUID().toString());
        update.setMessage(request.message().trim());
        update.setUpdatedByUserId(currentUser.getId());
        update.setUpdatedByName(currentUser.getFullName());
        update.setCreatedAt(Instant.now());

        ticket.getUpdates().add(update);
        incidentTicketRepository.save(ticket);
        return toUpdateResponse(update);
    }

    public TicketUpdateResponse editComment(String ticketId, String updateId, TicketUpdateEditRequest request, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);
        TicketUpdate update = findUpdate(ticket, updateId);
        if (!update.getUpdatedByUserId().equals(currentUser.getId()) && !currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("You can only edit your own comments unless you are an admin.");
        }
        update.setMessage(request.message().trim());
        update.setEditedAt(Instant.now());
        incidentTicketRepository.save(ticket);
        return toUpdateResponse(update);
    }

    public void deleteComment(String ticketId, String updateId, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);
        TicketUpdate update = findUpdate(ticket, updateId);
        if (!update.getUpdatedByUserId().equals(currentUser.getId()) && !currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("You can only delete your own comments unless you are an admin.");
        }
        ticket.getUpdates().removeIf(item -> item.getId().equals(updateId));
        incidentTicketRepository.save(ticket);
    }

    public TicketAttachmentResponse addAttachment(String ticketId, MultipartFile file, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        if (!ticket.getCreatedByUserId().equals(currentUser.getId()) && !hasOperationalAccess(currentUser)) {
            throw new ForbiddenOperationException("You can only attach files to your own tickets unless you are staff.");
        }
        if (ticket.getAttachments().size() >= MAX_ATTACHMENTS_PER_TICKET) {
            throw new IllegalArgumentException("Each ticket can include up to 3 image attachments.");
        }

        validateAttachment(file);
        ensureAttachmentDirectoryExists();

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "attachment" : file.getOriginalFilename());
        String extension = extractExtension(originalFileName);
        String storedFileName = ticket.getId() + "-" + UUID.randomUUID() + extension;
        Path destination = attachmentRoot.resolve(storedFileName).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store ticket attachment.", exception);
        }

        TicketAttachment attachment = new TicketAttachment();
        attachment.setId(UUID.randomUUID().toString());
        attachment.setOriginalFileName(originalFileName);
        attachment.setStoredFileName(storedFileName);
        attachment.setContentType(file.getContentType());
        attachment.setSize(file.getSize());
        attachment.setStoragePath(destination.toString());
        attachment.setUploadedAt(Instant.now());
        attachment.setUploadedByUserId(currentUser.getId());

        ticket.getAttachments().add(attachment);
        incidentTicketRepository.save(ticket);
        return toAttachmentResponse(ticket.getId(), attachment);
    }

    public List<TicketAttachmentResponse> getAttachments(String ticketId, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);
        return ticket.getAttachments().stream().map(attachment -> toAttachmentResponse(ticket.getId(), attachment)).toList();
    }

    public Resource loadAttachment(String ticketId, String attachmentId, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        enforceReadAccess(ticket, currentUser);
        TicketAttachment attachment = ticket.getAttachments().stream()
                .filter(item -> item.getId().equals(attachmentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Attachment not found: " + attachmentId));

        try {
            Resource resource = new UrlResource(Path.of(attachment.getStoragePath()).toUri());
            if (!resource.exists()) {
                throw new NotFoundException("Stored attachment file was not found.");
            }
            return resource;
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to open attachment file.", exception);
        }
    }

    public void deleteTicket(String ticketId, UserAccount currentUser) {
        IncidentTicket ticket = findActiveTicket(ticketId);
        if (!ticket.getCreatedByUserId().equals(currentUser.getId()) && !currentUser.getRoles().contains(Role.ADMIN)) {
            throw new ForbiddenOperationException("You can only delete your own tickets unless you are an admin.");
        }
        ticket.setDeleted(true);
        incidentTicketRepository.save(ticket);
    }

    private IncidentTicket findActiveTicket(String ticketId) {
        IncidentTicket ticket = incidentTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found: " + ticketId));
        if (ticket.isDeleted()) {
            throw new NotFoundException("Ticket not found: " + ticketId);
        }
        return ticket;
    }

    private TicketUpdate findUpdate(IncidentTicket ticket, String updateId) {
        return ticket.getUpdates().stream()
                .filter(item -> item.getId().equals(updateId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Ticket comment not found: " + updateId));
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required.");
        }
        if (!ALLOWED_ATTACHMENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Only JPG and PNG image attachments are allowed.");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new IllegalArgumentException("Attachment size must be 5MB or less.");
        }
    }

    private void ensureAttachmentDirectoryExists() {
        try {
            Files.createDirectories(attachmentRoot);
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to create the ticket upload directory.", exception);
        }
    }

    private void enforceReadAccess(IncidentTicket ticket, UserAccount currentUser) {
        if (hasOperationalAccess(currentUser) || ticket.getCreatedByUserId().equals(currentUser.getId())) {
            return;
        }
        throw new ForbiddenOperationException("You do not have access to this ticket.");
    }

    private void enforceOperationalWriteAccess(IncidentTicket ticket, UserAccount currentUser) {
        if (currentUser.getRoles().contains(Role.ADMIN)) {
            return;
        }
        if (currentUser.getRoles().contains(Role.TECHNICIAN)) {
            if (ticket.getAssignedToUserId() == null || ticket.getAssignedToUserId().equals(currentUser.getId())) {
                return;
            }
            throw new ForbiddenOperationException("This ticket is assigned to another technician.");
        }
        throw new ForbiddenOperationException("Only admins or technicians can update ticket operations.");
    }

    private boolean hasOperationalAccess(UserAccount user) {
        return user.getRoles().contains(Role.ADMIN) || user.getRoles().contains(Role.TECHNICIAN);
    }

    private void validateStatusTransition(IncidentTicket ticket, TicketStatusUpdateRequest request, UserAccount currentUser) {
        TicketStatus current = ticket.getStatus();
        TicketStatus next = request.status();

        if (current == TicketStatus.CLOSED || current == TicketStatus.REJECTED) {
            throw new IllegalArgumentException("Closed or rejected tickets cannot be updated further.");
        }
        if (next == TicketStatus.REJECTED) {
            if (!currentUser.getRoles().contains(Role.ADMIN)) {
                throw new ForbiddenOperationException("Only admins can reject tickets.");
            }
            if (request.rejectionReason() == null || request.rejectionReason().isBlank()) {
                throw new IllegalArgumentException("A rejection reason is required when rejecting a ticket.");
            }
            return;
        }
        if (current == TicketStatus.OPEN && next != TicketStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("OPEN tickets can only move to IN_PROGRESS or REJECTED.");
        }
        if (current == TicketStatus.IN_PROGRESS && next != TicketStatus.RESOLVED) {
            throw new IllegalArgumentException("IN_PROGRESS tickets can only move to RESOLVED.");
        }
        if (current == TicketStatus.RESOLVED && next != TicketStatus.CLOSED) {
            throw new IllegalArgumentException("RESOLVED tickets can only move to CLOSED.");
        }
        if (next == TicketStatus.RESOLVED && (request.resolutionNote() == null || request.resolutionNote().isBlank())) {
            throw new IllegalArgumentException("A resolution note is required when resolving a ticket.");
        }
    }

    private TicketResponse toResponse(IncidentTicket ticket) {
        return new TicketResponse(
                ticket.getId(),
                ticket.getResourceId(),
                ticket.getResourceName(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getLocation(),
                ticket.getCategory(),
                ticket.getPriority(),
                ticket.getPreferredContactDetails(),
                ticket.getStatus(),
                ticket.getRejectionReason(),
                ticket.getResolutionNotes(),
                ticket.getCreatedByUserId(),
                ticket.getCreatedByName(),
                ticket.getAssignedToUserId(),
                ticket.getAssignedToName(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getAttachments().stream().map(attachment -> toAttachmentResponse(ticket.getId(), attachment)).toList(),
                ticket.getUpdates().stream().map(this::toUpdateResponse).toList());
    }

    private TicketAttachmentResponse toAttachmentResponse(String ticketId, TicketAttachment attachment) {
        return new TicketAttachmentResponse(
                attachment.getId(),
                attachment.getOriginalFileName(),
                attachment.getContentType(),
                attachment.getSize(),
                attachment.getUploadedAt(),
                attachment.getUploadedByUserId(),
                "/api/tickets/" + ticketId + "/attachments/" + attachment.getId() + "/download");
    }

    private TicketUpdateResponse toUpdateResponse(TicketUpdate update) {
        return new TicketUpdateResponse(
                update.getId(),
                update.getMessage(),
                update.getUpdatedByUserId(),
                update.getUpdatedByName(),
                update.getCreatedAt(),
                update.getEditedAt());
    }

    private String extractExtension(String originalFileName) {
        int extensionIndex = originalFileName.lastIndexOf('.');
        return extensionIndex >= 0 ? originalFileName.substring(extensionIndex) : "";
    }
}
