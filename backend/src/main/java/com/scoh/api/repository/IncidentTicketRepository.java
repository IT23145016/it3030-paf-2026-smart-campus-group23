package com.scoh.api.repository;

import com.scoh.api.domain.IncidentTicket;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface IncidentTicketRepository extends MongoRepository<IncidentTicket, String> {
    List<IncidentTicket> findByDeletedFalseOrderByUpdatedAtDesc();
}
