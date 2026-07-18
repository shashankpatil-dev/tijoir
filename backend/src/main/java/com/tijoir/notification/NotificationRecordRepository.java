package com.tijoir.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRecordRepository extends JpaRepository<NotificationRecord, UUID> {
    Page<NotificationRecord> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Optional<NotificationRecord> findByIdAndUserId(UUID id, UUID userId);

    Optional<NotificationRecord> findTopByOrganizationInviteIdOrderByCreatedAtDesc(UUID organizationInviteId);
}
