package com.tijoir.secret;

import com.tijoir.organization.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "secret_versions")
public class SecretVersion {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "secret_id", nullable = false)
    private VaultSecret secret;

    @Column(nullable = false)
    private int versionNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StoredPayloadBackend storageBackend;

    @Column(length = 512)
    private String payloadRef;

    @Column(columnDefinition = "TEXT")
    private String payloadCiphertext;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(nullable = false)
    private Instant createdAt;

    protected SecretVersion() {
    }

    public SecretVersion(
            VaultSecret secret,
            int versionNumber,
            StoredPayloadBackend storageBackend,
            String payloadRef,
            String payloadCiphertext,
            UserAccount createdBy
    ) {
        this.secret = secret;
        this.versionNumber = versionNumber;
        this.storageBackend = storageBackend;
        this.payloadRef = payloadRef;
        this.payloadCiphertext = payloadCiphertext;
        this.createdBy = createdBy;
    }

    @PrePersist
    void beforeCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public String getPayloadRef() {
        return payloadRef;
    }

    public String getPayloadCiphertext() {
        return payloadCiphertext;
    }

    public int getVersionNumber() {
        return versionNumber;
    }
}
