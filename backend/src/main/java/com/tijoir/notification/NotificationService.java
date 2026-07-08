package com.tijoir.notification;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.paging.PageRequestFactory;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.notification.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationRecordRepository notificationRecordRepository;

    public NotificationService(NotificationRecordRepository notificationRecordRepository) {
        this.notificationRecordRepository = notificationRecordRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(AuthenticatedUser principal, Integer page, Integer size) {
        PageRequest pageRequest = PageRequestFactory.create(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<NotificationResponse> results = notificationRecordRepository.findByUserIdOrderByCreatedAtDesc(principal.userId(), pageRequest)
                .map(this::toResponse);
        return PageResponse.from(results);
    }

    @Transactional
    public NotificationResponse markRead(AuthenticatedUser principal, UUID notificationId) {
        NotificationRecord record = notificationRecordRepository.findByIdAndUserId(notificationId, principal.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        record.markRead();
        return toResponse(record);
    }

    private NotificationResponse toResponse(NotificationRecord record) {
        return new NotificationResponse(
                record.getId(),
                record.getType(),
                record.getTitle(),
                record.getMessage(),
                record.getActionUrl(),
                record.getRecipientEmail(),
                record.getEmailDeliveryStatus(),
                record.getReadAt(),
                record.getDeliveredAt(),
                record.getCreatedAt()
        );
    }
}
