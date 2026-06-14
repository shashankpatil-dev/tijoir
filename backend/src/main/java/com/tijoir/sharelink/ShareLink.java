package com.tijoir.sharelink;

import com.tijoir.contract.ContractPermission;
import com.tijoir.organization.Organization;
import com.tijoir.organization.UserAccount;
import com.tijoir.secret.VaultSecret;
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
@Table(name = "share_links")
public class ShareLink {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "secret_id", nullable = false)
    private VaultSecret secret;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Column(length = 255)
    private String recipientLabel;

    @Column(nullable = false, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_permission", nullable = false)
    private ContractPermission contractPermission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShareLinkStatus status;

    private Instant expiresAt;

    private Instant consumedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected ShareLink() {
    }

    public ShareLink(
            Organization organization,
            VaultSecret secret,
            UserAccount createdBy,
            String recipientLabel,
            String tokenHash,
            ContractPermission contractPermission,
            Instant expiresAt
    ) {
        this.organization = organization;
        this.secret = secret;
        this.createdBy = createdBy;
        this.recipientLabel = recipientLabel;
        this.tokenHash = tokenHash;
        this.contractPermission = contractPermission;
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

    public Organization getOrganization() {
        return organization;
    }

    public VaultSecret getSecret() {
        return secret;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }

    public String getRecipientLabel() {
        return recipientLabel;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public ContractPermission getContractPermission() {
        return contractPermission;
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

    public boolean isExpiredAt(Instant now) {
        return expiresAt != null && expiresAt.isBefore(now);
    }

    public void revoke() {
        this.status = ShareLinkStatus.REVOKED;
    }

    public void consume() {
        this.status = ShareLinkStatus.CONSUMED;
        this.consumedAt = Instant.now();
    }

    public void expire() {
        this.status = ShareLinkStatus.EXPIRED;
    }
}
