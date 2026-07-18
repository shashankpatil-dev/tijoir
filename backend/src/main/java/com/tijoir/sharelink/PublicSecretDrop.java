package com.tijoir.sharelink;

import com.tijoir.secret.SecretType;
import com.tijoir.secret.StoredPayloadBackend;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "public_secret_drops")
public class PublicSecretDrop {
    @Id
    private UUID id;

    @Column(nullable = false, length = 64, unique = true)
    private String tokenHash;

    @Column(length = 64, unique = true)
    private String manageTokenHash;

    @Column(nullable = false, length = 255)
    private String secretName;

    @Column(nullable = false, length = 255)
    private String secretKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private SecretType secretType;

    @Column(length = 255)
    private String senderLabel;

    @Column(length = 255)
    private String recipientLabel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private StoredPayloadBackend storageBackend;

    @Column(columnDefinition = "TEXT")
    private String payloadRef;

    @Column(columnDefinition = "TEXT")
    private String payloadCiphertext;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ShareLinkStatus status;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant consumedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected PublicSecretDrop() {
    }

    public PublicSecretDrop(
            String tokenHash,
            String manageTokenHash,
            String secretName,
            String secretKey,
            SecretType secretType,
            String senderLabel,
            String recipientLabel,
            Instant expiresAt
    ) {
        this.id = UUID.randomUUID();
        this.tokenHash = tokenHash;
        this.manageTokenHash = manageTokenHash;
        this.secretName = secretName;
        this.secretKey = secretKey;
        this.secretType = secretType;
        this.senderLabel = senderLabel;
        this.recipientLabel = recipientLabel;
        this.expiresAt = expiresAt;
        this.status = ShareLinkStatus.ACTIVE;
    }

    @PrePersist
    void beforeCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getManageTokenHash() {
        return manageTokenHash;
    }

    public String getSecretName() {
        return secretName;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public SecretType getSecretType() {
        return secretType;
    }

    public String getSenderLabel() {
        return senderLabel;
    }

    public String getRecipientLabel() {
        return recipientLabel;
    }

    public StoredPayloadBackend getStorageBackend() {
        return storageBackend;
    }

    public String getPayloadRef() {
        return payloadRef;
    }

    public String getPayloadCiphertext() {
        return payloadCiphertext;
    }

    public ShareLinkStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getConsumedAt() {
        return consumedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void storePayload(StoredPayloadBackend backend, String payloadRef, String payloadCiphertext) {
        this.storageBackend = backend;
        this.payloadRef = payloadRef;
        this.payloadCiphertext = payloadCiphertext;
    }

    public boolean isExpiredAt(Instant now) {
        return expiresAt.isBefore(now);
    }

    public void expire() {
        this.status = ShareLinkStatus.EXPIRED;
    }

    public void revoke() {
        this.status = ShareLinkStatus.REVOKED;
    }

    public void consume() {
        this.status = ShareLinkStatus.CONSUMED;
        this.consumedAt = Instant.now();
    }
}
