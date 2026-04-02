package com.scoh.api.repository;

import com.scoh.api.domain.CampusResource;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CampusResourceRepository extends MongoRepository<CampusResource, String> {

    boolean existsByResourceCodeIgnoreCaseAndIdNot(String resourceCode, String id);

    boolean existsByResourceCodeIgnoreCase(String resourceCode);

    Optional<CampusResource> findByResourceCodeIgnoreCase(String resourceCode);
}
