package com.scoh.api.repository;

import com.scoh.api.domain.Notification;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId);
    long countByRecipientUserIdAndReadFalse(String recipientUserId);
}
