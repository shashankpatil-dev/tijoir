package com.tijoir.connection;

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
@Table(name = "vendors")
public class Vendor {
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

    @Column
    private String contactName;

    @Column
    private String contactEmail;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorStatus status;

    private Instant offboardedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Vendor() {
    }

    public Vendor(
            Organization organization,
            UserAccount createdBy,
            String name,
            String contactName,
            String contactEmail,
            String notes
    ) {
        this.organization = organization;
        this.createdBy = createdBy;
        this.name = name;
        this.contactName = contactName;
        this.contactEmail = contactEmail;
        this.notes = notes;
        this.status = VendorStatus.ACTIVE;
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

    public String getContactName() {
        return contactName;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getNotes() {
        return notes;
    }

    public VendorStatus getStatus() {
        return status;
    }

    public Instant getOffboardedAt() {
        return offboardedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void offboard() {
        if (status != VendorStatus.OFFBOARDED) {
            status = VendorStatus.OFFBOARDED;
            offboardedAt = Instant.now();
        }
    }
}
