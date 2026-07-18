package com.tijoir.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "identity_users")
public class IdentityUser {
    @Id
    private UUID id;

    @Column(unique = true)
    private UUID legacyUserId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column
    private String passwordHash;

    @Column(unique = true)
    private String googleSub;

    private Instant emailVerifiedAt;

    private Instant deactivatedAt;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected IdentityUser() {
    }

    public IdentityUser(
            UUID legacyUserId,
            String email,
            String name,
            String passwordHash,
            String googleSub,
            Instant emailVerifiedAt,
            Instant deactivatedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.legacyUserId = legacyUserId;
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.googleSub = googleSub;
        this.emailVerifiedAt = emailVerifiedAt;
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
    }

    @PreUpdate
    void beforeUpdate() {
        updatedAt = Instant.now();
    }

    public void syncFromLegacy(
            UUID legacyUserId,
            String name,
            String passwordHash,
            String googleSub,
            Instant emailVerifiedAt,
            Instant deactivatedAt,
            Instant createdAt,
            Instant updatedAt
    ) {
        this.legacyUserId = legacyUserId;
        this.name = name;
        this.passwordHash = passwordHash;
        this.googleSub = googleSub;
        this.emailVerifiedAt = emailVerifiedAt;
        this.deactivatedAt = deactivatedAt;
        if (this.createdAt == null || (createdAt != null && createdAt.isBefore(this.createdAt))) {
            this.createdAt = createdAt;
        }
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public void rename(String name) {
        this.name = name;
    }

    public void changePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void linkGoogle(String googleSub) {
        this.googleSub = googleSub;
    }

    public void markEmailVerified() {
        if (emailVerifiedAt == null) {
            emailVerifiedAt = Instant.now();
        }
    }

    public void preferLegacyUser(UUID legacyUserId) {
        this.legacyUserId = legacyUserId;
    }

    public boolean isActive() {
        return deactivatedAt == null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getLegacyUserId() {
        return legacyUserId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getGoogleSub() {
        return googleSub;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }
}
