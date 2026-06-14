package com.tijoir.secret;

import com.tijoir.organization.Organization;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "secrets")
public class VaultSecret {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(nullable = false)
    private String name;

    @Column(name = "secret_key", nullable = false)
    private String secretKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "secret_type", nullable = false)
    private SecretType secretType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecretStatus status;

    @Column(nullable = false)
    private int currentVersionNumber;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected VaultSecret() {
    }

    public VaultSecret(
            Organization organization,
            UserAccount createdBy,
            String name,
            String secretKey,
            SecretType secretType,
            String description
    ) {
        this.organization = organization;
        this.createdBy = createdBy;
        this.name = name;
        this.secretKey = secretKey;
        this.secretType = secretType;
        this.description = description;
        this.status = SecretStatus.ACTIVE;
        this.currentVersionNumber = 1;
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

    public Organization getOrganization() {
        return organization;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }

    public String getName() {
        return name;
    }

    public String getSecretKey() {
        return secretKey;
    }

    public SecretType getSecretType() {
        return secretType;
    }

    public String getDescription() {
        return description;
    }

    public SecretStatus getStatus() {
        return status;
    }

    public int getCurrentVersionNumber() {
        return currentVersionNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void revoke() {
        this.status = SecretStatus.REVOKED;
    }

    public void activate() {
        this.status = SecretStatus.ACTIVE;
    }

    public void setCurrentVersionNumber(int currentVersionNumber) {
        this.currentVersionNumber = currentVersionNumber;
    }
}
