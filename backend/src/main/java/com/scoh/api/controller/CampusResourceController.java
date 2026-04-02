package com.scoh.api.controller;

import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import com.scoh.api.dto.ResourceRequest;
import com.scoh.api.dto.ResourceResponse;
import com.scoh.api.dto.ResourceStatusUpdateRequest;
import com.scoh.api.service.CampusResourceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/resources")
public class CampusResourceController {

    private final CampusResourceService campusResourceService;

    public CampusResourceController(CampusResourceService campusResourceService) {
        this.campusResourceService = campusResourceService;
    }

    @GetMapping
    public List<ResourceResponse> getResources(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) @Min(value = 1, message = "Minimum capacity must be at least 1.") Integer minCapacity,
            @RequestParam(required = false) ResourceStatus status) {
        return campusResourceService.searchResources(query, type, location, minCapacity, status);
    }

    @GetMapping("/{resourceId}")
    public ResourceResponse getResource(@PathVariable String resourceId) {
        return campusResourceService.getResourceById(resourceId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse createResource(@Valid @RequestBody ResourceRequest request) {
        return campusResourceService.createResource(request);
    }

    @PutMapping("/{resourceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateResource(@PathVariable String resourceId, @Valid @RequestBody ResourceRequest request) {
        return campusResourceService.updateResource(resourceId, request);
    }

    @PatchMapping("/{resourceId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponse updateStatus(
            @PathVariable String resourceId,
            @Valid @RequestBody ResourceStatusUpdateRequest request) {
        return campusResourceService.updateStatus(resourceId, request.status());
    }

    @DeleteMapping("/{resourceId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> deleteResource(@PathVariable String resourceId) {
        campusResourceService.deleteResource(resourceId);
        return Map.of("message", "Resource deleted successfully.");
    }
}
