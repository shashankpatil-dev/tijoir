package com.tijoir.organization;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "organization_policies")
public class OrganizationPolicy {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    private Integer defaultShareLinkExpiryHours;

    @Column(nullable = false)
    private boolean requireVendorContractForShareLinks;

    @Column(nullable = false)
    private boolean allowViewOnce;

    @Column(nullable = false)
    private boolean allowViewUntilRevoked;

    @Column(nullable = false)
    private boolean allowRotationNotifyOnly;

    private Integer rotationReminderDays;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected OrganizationPolicy() {
    }

    public OrganizationPolicy(
            Organization organization,
            Integer defaultShareLinkExpiryHours,
            boolean requireVendorContractForShareLinks,
            boolean allowViewOnce,
            boolean allowViewUntilRevoked,
            boolean allowRotationNotifyOnly,
            Integer rotationReminderDays
    ) {
        this.organization = organization;
        this.defaultShareLinkExpiryHours = defaultShareLinkExpiryHours;
        this.requireVendorContractForShareLinks = requireVendorContractForShareLinks;
        this.allowViewOnce = allowViewOnce;
        this.allowViewUntilRevoked = allowViewUntilRevoked;
        this.allowRotationNotifyOnly = allowRotationNotifyOnly;
        this.rotationReminderDays = rotationReminderDays;
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

    public Integer getDefaultShareLinkExpiryHours() {
        return defaultShareLinkExpiryHours;
    }

    public boolean isRequireVendorContractForShareLinks() {
        return requireVendorContractForShareLinks;
    }

    public boolean isAllowViewOnce() {
        return allowViewOnce;
    }

    public boolean isAllowViewUntilRevoked() {
        return allowViewUntilRevoked;
    }

    public boolean isAllowRotationNotifyOnly() {
        return allowRotationNotifyOnly;
    }

    public Integer getRotationReminderDays() {
        return rotationReminderDays;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(
            Integer defaultShareLinkExpiryHours,
            boolean requireVendorContractForShareLinks,
            boolean allowViewOnce,
            boolean allowViewUntilRevoked,
            boolean allowRotationNotifyOnly,
            Integer rotationReminderDays
    ) {
        this.defaultShareLinkExpiryHours = defaultShareLinkExpiryHours;
        this.requireVendorContractForShareLinks = requireVendorContractForShareLinks;
        this.allowViewOnce = allowViewOnce;
        this.allowViewUntilRevoked = allowViewUntilRevoked;
        this.allowRotationNotifyOnly = allowRotationNotifyOnly;
        this.rotationReminderDays = rotationReminderDays;
    }
}
