package com.tijoir.organization;

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
@Table(name = "organization_invites")
public class OrganizationInvite {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_user_id", nullable = false)
    private UserAccount invitedBy;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant acceptedAt;

    private Instant revokedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected OrganizationInvite() {
    }

    public OrganizationInvite(
            Organization organization,
            UserAccount invitedBy,
            String email,
            UserRole role,
            String tokenHash,
            Instant expiresAt
    ) {
        this.organization = organization;
        this.invitedBy = invitedBy;
        this.email = email;
        this.role = role;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
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

    public boolean isExpiredAt(Instant instant) {
        return expiresAt.isBefore(instant) || expiresAt.equals(instant);
    }

    public OrganizationInviteStatus statusAt(Instant instant) {
        if (revokedAt != null) {
            return OrganizationInviteStatus.REVOKED;
        }
        if (acceptedAt != null) {
            return OrganizationInviteStatus.ACCEPTED;
        }
        if (isExpiredAt(instant)) {
            return OrganizationInviteStatus.EXPIRED;
        }
        return OrganizationInviteStatus.PENDING;
    }

    public boolean isUsableAt(Instant instant) {
        return statusAt(instant) == OrganizationInviteStatus.PENDING;
    }

    public void accept() {
        if (acceptedAt == null) {
            acceptedAt = Instant.now();
        }
    }

    public void revoke() {
        if (revokedAt == null) {
            revokedAt = Instant.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public UserAccount getInvitedBy() {
        return invitedBy;
    }

    public String getEmail() {
        return email;
    }

    public UserRole getRole() {
        return role;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getAcceptedAt() {
        return acceptedAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
