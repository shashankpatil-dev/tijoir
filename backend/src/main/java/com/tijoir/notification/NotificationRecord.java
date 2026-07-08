package com.tijoir.notification;

import com.tijoir.organization.Organization;
import com.tijoir.organization.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_records")
public class NotificationRecord {
    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id")
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 64)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "action_url", length = 1024)
    private String actionUrl;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_delivery_status", nullable = false, length = 32)
    private NotificationEmailDeliveryStatus emailDeliveryStatus;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "last_error", length = 1000)
    private String lastError;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected NotificationRecord() {
    }

    public NotificationRecord(
            Organization organization,
            UserAccount user,
            NotificationType type,
            String title,
            String message,
            String actionUrl,
            String recipientEmail,
            NotificationEmailDeliveryStatus emailDeliveryStatus
    ) {
        this.organization = organization;
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.actionUrl = actionUrl;
        this.recipientEmail = recipientEmail;
        this.emailDeliveryStatus = emailDeliveryStatus;
        this.createdAt = Instant.now();
    }

    public void markRead() {
        if (readAt == null) {
            readAt = Instant.now();
        }
    }

    public void markDelivered() {
        emailDeliveryStatus = NotificationEmailDeliveryStatus.SENT;
        deliveredAt = Instant.now();
        lastError = null;
    }

    public void markSkipped() {
        emailDeliveryStatus = NotificationEmailDeliveryStatus.SKIPPED;
        deliveredAt = Instant.now();
        lastError = null;
    }

    public void markFailed(String error) {
        emailDeliveryStatus = NotificationEmailDeliveryStatus.FAILED;
        lastError = error;
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public UserAccount getUser() {
        return user;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getActionUrl() {
        return actionUrl;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public NotificationEmailDeliveryStatus getEmailDeliveryStatus() {
        return emailDeliveryStatus;
    }

    public Instant getReadAt() {
        return readAt;
    }

    public Instant getDeliveredAt() {
        return deliveredAt;
    }

    public String getLastError() {
        return lastError;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
