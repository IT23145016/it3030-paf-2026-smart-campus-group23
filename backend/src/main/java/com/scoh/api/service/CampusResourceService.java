package com.scoh.api.service;

import com.scoh.api.domain.AvailabilityWindow;
import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import com.scoh.api.dto.AvailabilityWindowRequest;
import com.scoh.api.dto.ResourceRequest;
import com.scoh.api.dto.ResourceResponse;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.CampusResourceRepository;
import jakarta.validation.ValidationException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CampusResourceService {

    private final CampusResourceRepository campusResourceRepository;
    private final MongoTemplate mongoTemplate;

    public CampusResourceService(CampusResourceRepository campusResourceRepository, MongoTemplate mongoTemplate) {
        this.campusResourceRepository = campusResourceRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<ResourceResponse> searchResources(
            String query,
            ResourceType type,
            String location,
            Integer minCapacity,
            ResourceStatus status) {
        Query mongoQuery = new Query().with(Sort.by(Sort.Direction.ASC, "name"));
        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(query)) {
            String escaped = Pattern.quote(query.trim());
            criteria.add(new Criteria().orOperator(
                    Criteria.where("name").regex(escaped, "i"),
                    Criteria.where("resourceCode").regex(escaped, "i"),
                    Criteria.where("description").regex(escaped, "i"),
                    Criteria.where("amenities").regex(escaped, "i")));
        }

        if (type != null) {
            criteria.add(Criteria.where("type").is(type));
        }

        if (StringUtils.hasText(location)) {
            criteria.add(Criteria.where("location").regex(Pattern.quote(location.trim()), "i"));
        }

        if (minCapacity != null) {
            criteria.add(Criteria.where("capacity").gte(minCapacity));
        }

        if (status != null) {
            criteria.add(Criteria.where("status").is(status));
        }

        if (!criteria.isEmpty()) {
            mongoQuery.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        return mongoTemplate.find(mongoQuery, CampusResource.class).stream()
                .map(this::toResponse)
                .toList();
    }

    public ResourceResponse getResourceById(String resourceId) {
        return toResponse(findResource(resourceId));
    }

    public ResourceResponse createResource(ResourceRequest request) {
        validateAvailabilityWindows(request.availabilityWindows());
        if (campusResourceRepository.existsByResourceCodeIgnoreCase(request.resourceCode().trim())) {
            throw new DuplicateKeyException("A resource with code '" + request.resourceCode().trim() + "' already exists.");
        }

        CampusResource resource = new CampusResource();
        applyRequest(resource, request);
        return toResponse(campusResourceRepository.save(resource));
    }

    public ResourceResponse updateResource(String resourceId, ResourceRequest request) {
        validateAvailabilityWindows(request.availabilityWindows());
        CampusResource resource = findResource(resourceId);
        if (campusResourceRepository.existsByResourceCodeIgnoreCaseAndIdNot(request.resourceCode().trim(), resourceId)) {
            throw new DuplicateKeyException("A resource with code '" + request.resourceCode().trim() + "' already exists.");
        }

        applyRequest(resource, request);
        return toResponse(campusResourceRepository.save(resource));
    }

    public ResourceResponse updateStatus(String resourceId, ResourceStatus status) {
        CampusResource resource = findResource(resourceId);
        resource.setStatus(status);
        return toResponse(campusResourceRepository.save(resource));
    }

    public void deleteResource(String resourceId) {
        CampusResource resource = findResource(resourceId);
        campusResourceRepository.delete(resource);
    }

    private CampusResource findResource(String resourceId) {
        return campusResourceRepository.findById(resourceId)
                .orElseThrow(() -> new NotFoundException("Resource not found: " + resourceId));
    }

    private void applyRequest(CampusResource resource, ResourceRequest request) {
        resource.setResourceCode(request.resourceCode().trim().toUpperCase());
        resource.setName(request.name().trim());
        resource.setType(request.type());
        resource.setCapacity(request.capacity());
        resource.setLocation(request.location().trim());
        resource.setStatus(request.status());
        resource.setDescription(request.description() == null ? "" : request.description().trim());
        resource.setAmenities(request.amenities() == null
                ? List.of()
                : request.amenities().stream()
                        .map(String::trim)
                        .filter(StringUtils::hasText)
                        .distinct()
                        .toList());
        resource.setAvailabilityWindows(request.availabilityWindows().stream()
                .map(this::toAvailabilityWindow)
                .toList());
    }

    private AvailabilityWindow toAvailabilityWindow(AvailabilityWindowRequest request) {
        AvailabilityWindow window = new AvailabilityWindow();
        window.setDayOfWeek(normalizeDay(request.dayOfWeek()));
        window.setStartTime(request.startTime());
        window.setEndTime(request.endTime());
        return window;
    }

    private void validateAvailabilityWindows(List<AvailabilityWindowRequest> windows) {
        for (AvailabilityWindowRequest window : windows) {
            String day = normalizeDay(window.dayOfWeek());
            LocalTime start = LocalTime.parse(window.startTime());
            LocalTime end = LocalTime.parse(window.endTime());

            if (!start.isBefore(end)) {
                throw new ValidationException("Availability window for " + day + " must have a start time before the end time.");
            }
        }
    }

    private String normalizeDay(String dayOfWeek) {
        return DayOfWeek.valueOf(dayOfWeek.trim().toUpperCase()).name();
    }

    private ResourceResponse toResponse(CampusResource resource) {
        return new ResourceResponse(
                resource.getId(),
                resource.getResourceCode(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation(),
                resource.getStatus(),
                resource.getDescription(),
                resource.getAmenities(),
                resource.getAvailabilityWindows().stream()
                        .map(window -> new AvailabilityWindowRequest(
                                window.getDayOfWeek(),
                                window.getStartTime(),
                                window.getEndTime()))
                        .toList(),
                resource.getCreatedAt(),
                resource.getUpdatedAt());
    }
}
