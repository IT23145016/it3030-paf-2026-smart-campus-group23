package com.scoh.api.config;

import com.scoh.api.domain.AvailabilityWindow;
import com.scoh.api.domain.CampusResource;
import com.scoh.api.domain.ResourceStatus;
import com.scoh.api.domain.ResourceType;
import com.scoh.api.repository.CampusResourceRepository;
import java.util.List;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ResourceDataSeeder {

    @Bean
    ApplicationRunner seedCampusResources(CampusResourceRepository campusResourceRepository) {
        return args -> {
            if (campusResourceRepository.count() > 0) {
                return;
            }

            campusResourceRepository.saveAll(List.of(
                    buildResource(
                            "LH-201",
                            "Engineering Lecture Hall",
                            ResourceType.LECTURE_HALL,
                            120,
                            "Block B - Level 2",
                            ResourceStatus.ACTIVE,
                            "Tiered lecture hall with projector, lecture capture, and hybrid delivery setup.",
                            List.of("Projector", "PA System", "Hybrid Camera"),
                            List.of(
                                    window("MONDAY", "08:00", "18:00"),
                                    window("TUESDAY", "08:00", "18:00"),
                                    window("WEDNESDAY", "08:00", "18:00"))),
                    buildResource(
                            "LAB-04",
                            "IoT Innovation Lab",
                            ResourceType.LAB,
                            40,
                            "Tech Building - Level 1",
                            ResourceStatus.ACTIVE,
                            "Hands-on lab for embedded systems, networking, and rapid prototyping sessions.",
                            List.of("Workbenches", "3D Printer", "Smart Boards"),
                            List.of(
                                    window("MONDAY", "09:00", "17:00"),
                                    window("THURSDAY", "09:00", "17:00"),
                                    window("FRIDAY", "09:00", "17:00"))),
                    buildResource(
                            "EQ-PRJ-09",
                            "Portable Projector Kit",
                            ResourceType.EQUIPMENT,
                            1,
                            "AV Equipment Store",
                            ResourceStatus.MAINTENANCE,
                            "Portable projector set with HDMI adapters and carry case.",
                            List.of("HDMI Adapter", "Carry Case", "Remote"),
                            List.of(
                                    window("MONDAY", "08:30", "16:30"),
                                    window("TUESDAY", "08:30", "16:30"),
                                    window("WEDNESDAY", "08:30", "16:30")))));
        };
    }

    private CampusResource buildResource(
            String code,
            String name,
            ResourceType type,
            int capacity,
            String location,
            ResourceStatus status,
            String description,
            List<String> amenities,
            List<AvailabilityWindow> windows) {
        CampusResource resource = new CampusResource();
        resource.setResourceCode(code);
        resource.setName(name);
        resource.setType(type);
        resource.setCapacity(capacity);
        resource.setLocation(location);
        resource.setStatus(status);
        resource.setDescription(description);
        resource.setAmenities(amenities);
        resource.setAvailabilityWindows(windows);
        return resource;
    }

    private AvailabilityWindow window(String dayOfWeek, String startTime, String endTime) {
        AvailabilityWindow window = new AvailabilityWindow();
        window.setDayOfWeek(dayOfWeek);
        window.setStartTime(startTime);
        window.setEndTime(endTime);
        return window;
    }
}
