package com.scoh.api.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import com.scoh.api.dto.AvailabilityWindowRequest;
import com.scoh.api.dto.ResourceRequest;
import com.scoh.api.exception.NotFoundException;
import com.scoh.api.repository.CampusResourceRepository;
import jakarta.validation.ValidationException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class CampusResourceServiceTest {

    @Mock
    private CampusResourceRepository campusResourceRepository;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private CampusResourceService campusResourceService;

    @Test
    void shouldCreateResource() {
        when(campusResourceRepository.existsByResourceCodeIgnoreCase("LH-201")).thenReturn(false);
        when(campusResourceRepository.save(any(CampusResource.class))).thenAnswer(invocation -> {
            CampusResource resource = invocation.getArgument(0);
            resource.setId("resource-1");
            return resource;
        });

        var response = campusResourceService.createResource(validRequest());

        assertThat(response.id()).isEqualTo("resource-1");
        assertThat(response.resourceCode()).isEqualTo("LH-201");
        assertThat(response.type()).isEqualTo(ResourceType.LECTURE_HALL);
    }

    @Test
    void shouldRejectDuplicateResourceCode() {
        when(campusResourceRepository.existsByResourceCodeIgnoreCase("LH-201")).thenReturn(true);

        assertThatThrownBy(() -> campusResourceService.createResource(validRequest()))
                .isInstanceOf(DuplicateKeyException.class)
                .hasMessageContaining("LH-201");
    }

    @Test
    void shouldRejectInvalidAvailabilityWindow() {
        ResourceRequest invalidRequest = new ResourceRequest(
                "EQ-14",
                "Camera Kit",
                ResourceType.EQUIPMENT,
                1,
                "Media Store",
                ResourceStatus.ACTIVE,
                "Portable recording kit",
                List.of("Tripod"),
                List.of(new AvailabilityWindowRequest("MONDAY", "16:00", "09:00")));

        assertThatThrownBy(() -> campusResourceService.createResource(invalidRequest))
                .isInstanceOf(ValidationException.class);

        verify(campusResourceRepository, never()).save(any(CampusResource.class));
    }

    @Test
    void shouldDeleteResource() {
        CampusResource resource = new CampusResource();
        resource.setId("resource-1");
        when(campusResourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));

        campusResourceService.deleteResource("resource-1");

        verify(campusResourceRepository).delete(resource);
    }

    @Test
    void shouldThrowWhenResourceMissing() {
        when(campusResourceRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> campusResourceService.getResourceById("missing"))
                .isInstanceOf(NotFoundException.class);
    }

    private ResourceRequest validRequest() {
        return new ResourceRequest(
                "LH-201",
                "Engineering Lecture Hall",
                ResourceType.LECTURE_HALL,
                120,
                "Block B - Level 2",
                ResourceStatus.ACTIVE,
                "Tiered lecture hall with hybrid teaching setup",
                List.of("Projector", "Hybrid Camera", "PA System"),
                List.of(
                        new AvailabilityWindowRequest("MONDAY", "08:00", "18:00"),
                        new AvailabilityWindowRequest("TUESDAY", "08:00", "18:00")));
    }
}
