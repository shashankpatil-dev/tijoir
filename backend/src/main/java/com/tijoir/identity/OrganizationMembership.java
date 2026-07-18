package com.tijoir.identity;

import com.tijoir.organization.Organization;
import com.tijoir.organization.UserRole;
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
@Table(name = "organization_memberships")
public class OrganizationMembership {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "identity_user_id", nullable = false)
    private IdentityUser identityUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(unique = true)
    private UUID legacyUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationMembershipStatus status;

    @Column(nullable = false)
    private boolean managedMember;

    @Column(nullable = false)
    private Instant joinedAt;

    private Instant deactivatedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected OrganizationMembership() {
    }

    public OrganizationMembership(
            IdentityUser identityUser,
            Organization organization,
            UUID legacyUserId,
            UserRole role,
            OrganizationMembershipStatus status,
            boolean managedMember,
            Instant joinedAt,
            Instant deactivatedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.identityUser = identityUser;
        this.organization = organization;
        this.legacyUserId = legacyUserId;
        this.role = role;
        this.status = status;
        this.managedMember = managedMember;
        this.joinedAt = joinedAt;
        this.deactivatedAt = deactivatedAt;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    void beforeCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (joinedAt == null) {
            joinedAt = createdAt;
        }
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = Instant.now();
    }

    public void syncFromLegacy(
            UUID legacyUserId,
            UserRole role,
            OrganizationMembershipStatus status,
            Instant joinedAt,
            Instant deactivatedAt,
            Instant updatedAt
    ) {
        this.legacyUserId = legacyUserId;
        this.role = role;
        this.status = status;
        if (this.joinedAt == null || (joinedAt != null && joinedAt.isBefore(this.joinedAt))) {
            this.joinedAt = joinedAt;
        }
        this.deactivatedAt = deactivatedAt;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public IdentityUser getIdentityUser() {
        return identityUser;
    }

    public Organization getOrganization() {
        return organization;
    }

    public UUID getLegacyUserId() {
        return legacyUserId;
    }

    public UserRole getRole() {
        return role;
    }

    public OrganizationMembershipStatus getStatus() {
        return status;
    }

    public Instant getJoinedAt() {
        return joinedAt;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }

    public boolean isActive() {
        return status == OrganizationMembershipStatus.ACTIVE && deactivatedAt == null;
    }
}
