package com.tijoir.connection;

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
@Table(name = "vendor_access_contracts")
public class VendorAccessContract {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "secret_id", nullable = false)
    private VaultSecret secret;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private UserAccount createdBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_permission", nullable = false)
    private ContractPermission contractPermission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VendorAccessContractStatus status;

    private Instant expiresAt;

    private Instant revokedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected VendorAccessContract() {
    }

    public VendorAccessContract(
            Organization organization,
            Vendor vendor,
            VaultSecret secret,
            UserAccount createdBy,
            ContractPermission contractPermission,
            Instant expiresAt
    ) {
        this.organization = organization;
        this.vendor = vendor;
        this.secret = secret;
        this.createdBy = createdBy;
        this.contractPermission = contractPermission;
        this.expiresAt = expiresAt;
        this.status = VendorAccessContractStatus.ACTIVE;
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

    public Vendor getVendor() {
        return vendor;
    }

    public VaultSecret getSecret() {
        return secret;
    }

    public UserAccount getCreatedBy() {
        return createdBy;
    }

    public ContractPermission getContractPermission() {
        return contractPermission;
    }

    public VendorAccessContractStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isExpiredAt(Instant now) {
        return expiresAt != null && !expiresAt.isAfter(now);
    }

    public void revoke() {
        if (status != VendorAccessContractStatus.REVOKED) {
            status = VendorAccessContractStatus.REVOKED;
            revokedAt = Instant.now();
        }
    }

    public void expire() {
        if (status == VendorAccessContractStatus.ACTIVE) {
            status = VendorAccessContractStatus.EXPIRED;
        }
    }
}
