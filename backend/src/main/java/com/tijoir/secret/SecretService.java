package com.tijoir.secret;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tijoir.audit.AuditAction;
import com.tijoir.audit.AuditEvent;
import com.tijoir.audit.AuditEventRepository;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.organization.OrganizationAuthorizationService;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.secret.dto.CreateSecretRequest;
import com.tijoir.secret.dto.GenerateSecretRequest;
import com.tijoir.secret.dto.GeneratedSecretResponse;
import com.tijoir.secret.dto.RevealSecretResponse;
import com.tijoir.secret.dto.RotateSecretRequest;
import com.tijoir.secret.dto.SecretDetailResponse;
import com.tijoir.secret.dto.SecretSummaryResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class SecretService {
    private final VaultSecretRepository vaultSecretRepository;
    private final SecretVersionRepository secretVersionRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationAuthorizationService authorizationService;
    private final SecretPayloadStore secretPayloadStore;
    private final AuditEventRepository auditEventRepository;
    private final ObjectMapper objectMapper;

    public SecretService(
            VaultSecretRepository vaultSecretRepository,
            SecretVersionRepository secretVersionRepository,
            UserAccountRepository userAccountRepository,
            OrganizationAuthorizationService authorizationService,
            SecretPayloadStore secretPayloadStore,
            AuditEventRepository auditEventRepository,
            ObjectMapper objectMapper
    ) {
        this.vaultSecretRepository = vaultSecretRepository;
        this.secretVersionRepository = secretVersionRepository;
        this.userAccountRepository = userAccountRepository;
        this.authorizationService = authorizationService;
        this.secretPayloadStore = secretPayloadStore;
        this.auditEventRepository = auditEventRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public SecretDetailResponse create(AuthenticatedUser principal, CreateSecretRequest request) {
        authorizationService.requireSecretManager(principal.role());

        UserAccount actor = findActor(principal);
        String secretKey = uniqueSecretKey(principal.organizationId(), request.name());
        VaultSecret secret = vaultSecretRepository.save(new VaultSecret(
                actor.getOrganization(),
                actor,
                request.name().trim(),
                secretKey,
                request.type(),
                normalizeDescription(request.description())
        ));

        String normalizedValue = normalizeSecretValue(request.type(), request.value());
        SecretPayloadStore.StoredPayload storedPayload = secretPayloadStore.store(secret, 1, normalizedValue);
        secretVersionRepository.save(new SecretVersion(
                secret,
                1,
                storedPayload.backend(),
                storedPayload.payloadRef(),
                storedPayload.payloadCiphertext(),
                actor
        ));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.SECRET_CREATED,
                "SECRET",
                secret.getId(),
                toJson(Map.of(
                        "secretKey", secret.getSecretKey(),
                        "type", secret.getSecretType().name(),
                        "version", 1
                ))
        ));

        return detail(secret);
    }

    @Transactional(readOnly = true)
    public List<SecretSummaryResponse> list(AuthenticatedUser principal) {
        return vaultSecretRepository.findAllByOrganizationIdOrderByCreatedAtDesc(principal.organizationId())
                .stream()
                .map(this::summary)
                .toList();
    }

    @Transactional(readOnly = true)
    public GeneratedSecretResponse generate(AuthenticatedUser principal, GenerateSecretRequest request) {
        authorizationService.requireSecretManager(principal.role());
        int length = request.length() == null ? defaultLength(request.type()) : request.length();
        return new GeneratedSecretResponse(request.type(), length, generatedValue(request.type(), length));
    }

    @Transactional(readOnly = true)
    public SecretDetailResponse get(AuthenticatedUser principal, UUID secretId) {
        VaultSecret secret = vaultSecretRepository.findByIdAndOrganizationId(secretId, principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret not found"));
        return detail(secret);
    }

    @Transactional(readOnly = true)
    public RevealSecretResponse reveal(AuthenticatedUser principal, UUID secretId) {
        authorizationService.requireSecretManager(principal.role());
        UserAccount actor = findActor(principal);
        VaultSecret secret = findSecret(principal.organizationId(), secretId);
        if (secret.getStatus() == SecretStatus.REVOKED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Secret has been revoked");
        }
        SecretVersion version = secretVersionRepository.findBySecretIdAndVersionNumber(secret.getId(), secret.getCurrentVersionNumber())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret version not found"));

        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.SECRET_REVEALED,
                "SECRET",
                secret.getId(),
                toJson(Map.of(
                        "secretKey", secret.getSecretKey(),
                        "type", secret.getSecretType().name(),
                        "version", version.getVersionNumber()
                ))
        ));

        return new RevealSecretResponse(
                secret.getId(),
                secret.getSecretKey(),
                secret.getSecretType(),
                version.getVersionNumber(),
                secretPayloadStore.reveal(version)
        );
    }

    @Transactional
    public SecretDetailResponse revoke(AuthenticatedUser principal, UUID secretId) {
        authorizationService.requireSecretManager(principal.role());
        UserAccount actor = findActor(principal);
        VaultSecret secret = findSecret(principal.organizationId(), secretId);
        if (secret.getStatus() != SecretStatus.REVOKED) {
            secret.revoke();
            auditEventRepository.save(new AuditEvent(
                    actor.getOrganization(),
                    actor,
                    AuditAction.SECRET_REVOKED,
                    "SECRET",
                    secret.getId(),
                    toJson(Map.of(
                            "secretKey", secret.getSecretKey(),
                            "type", secret.getSecretType().name()
                    ))
            ));
        }
        return detail(secret);
    }

    @Transactional
    public SecretDetailResponse rotate(AuthenticatedUser principal, UUID secretId, RotateSecretRequest request) {
        authorizationService.requireSecretManager(principal.role());
        UserAccount actor = findActor(principal);
        VaultSecret secret = findSecret(principal.organizationId(), secretId);

        int nextVersion = secret.getCurrentVersionNumber() + 1;
        String normalizedValue = normalizeSecretValue(secret.getSecretType(), request.value());
        SecretPayloadStore.StoredPayload storedPayload = secretPayloadStore.store(secret, nextVersion, normalizedValue);
        secretVersionRepository.save(new SecretVersion(
                secret,
                nextVersion,
                storedPayload.backend(),
                storedPayload.payloadRef(),
                storedPayload.payloadCiphertext(),
                actor
        ));

        secret.setCurrentVersionNumber(nextVersion);
        secret.activate();
        auditEventRepository.save(new AuditEvent(
                actor.getOrganization(),
                actor,
                AuditAction.SECRET_ROTATED,
                "SECRET",
                secret.getId(),
                toJson(Map.of(
                        "secretKey", secret.getSecretKey(),
                        "type", secret.getSecretType().name(),
                        "version", nextVersion
                ))
        ));

        return detail(secret);
    }

    private UserAccount findActor(AuthenticatedUser principal) {
        return authorizationService.requireActor(principal);
    }

    private SecretSummaryResponse summary(VaultSecret secret) {
        return new SecretSummaryResponse(
                secret.getId(),
                secret.getName(),
                secret.getSecretKey(),
                secret.getSecretType(),
                secret.getStatus(),
                secret.getCurrentVersionNumber(),
                secret.getCreatedAt()
        );
    }

    private SecretDetailResponse detail(VaultSecret secret) {
        return new SecretDetailResponse(
                secret.getId(),
                secret.getName(),
                secret.getSecretKey(),
                secret.getSecretType(),
                secret.getDescription(),
                secret.getStatus(),
                secret.getCurrentVersionNumber(),
                secret.getCreatedBy().getName(),
                secret.getCreatedBy().getEmail(),
                secret.getCreatedAt()
        );
    }

    private String uniqueSecretKey(UUID organizationId, String name) {
        String base = slugify(name);
        String candidate = base;
        int counter = 2;
        while (vaultSecretRepository.existsByOrganizationIdAndSecretKey(organizationId, candidate)) {
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            return "secret-" + UUID.randomUUID().toString().substring(0, 8);
        }
        return normalized;
    }

    private String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.trim();
    }

    private VaultSecret findSecret(UUID organizationId, UUID secretId) {
        return vaultSecretRepository.findByIdAndOrganizationId(secretId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Secret not found"));
    }

    private String toJson(Map<String, Object> details) {
        try {
            return objectMapper.writeValueAsString(details);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not serialize audit details", ex);
        }
    }

    private int defaultLength(SecretType type) {
        return switch (type) {
            case PASSWORD, SFTP_PASSWORD -> 24;
            case API_KEY, TOKEN, WEBHOOK_SECRET, CUSTOM -> 32;
            case SSH_PRIVATE_KEY, SSH_PUBLIC_KEY, CERTIFICATE -> throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Secret generation is not supported for %s".formatted(type.name())
            );
        };
    }

    private String generatedValue(SecretType type, int length) {
        return switch (type) {
            case PASSWORD, SFTP_PASSWORD -> CryptoUtil.randomFromAlphabet(
                    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+",
                    length
            );
            case API_KEY, TOKEN, WEBHOOK_SECRET, CUSTOM -> CryptoUtil.randomFromAlphabet(
                    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
                    length
            );
            case SSH_PRIVATE_KEY, SSH_PUBLIC_KEY, CERTIFICATE -> throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Secret generation is not supported for %s".formatted(type.name())
            );
        };
    }

    private String normalizeSecretValue(SecretType type, String value) {
        String normalized = value.trim();
        validateSecretValue(type, normalized);
        return normalized;
    }

    private void validateSecretValue(SecretType type, String value) {
        switch (type) {
            case SSH_PUBLIC_KEY -> validateSshPublicKey(value);
            case SSH_PRIVATE_KEY -> validateSshPrivateKey(value);
            case CERTIFICATE -> validateCertificate(value);
            default -> {
            }
        }
    }

    private void validateSshPublicKey(String value) {
        if (value.startsWith("ssh-rsa ")
                || value.startsWith("ssh-ed25519 ")
                || value.startsWith("ecdsa-sha2-")) {
            return;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "SSH public key must be in OpenSSH public key format");
    }

    private void validateSshPrivateKey(String value) {
        if (!value.contains("BEGIN") || !value.contains("PRIVATE KEY")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SSH private key must contain a PEM/OpenSSH private key block");
        }
    }

    private void validateCertificate(String value) {
        if (value.contains("-----BEGIN CERTIFICATE-----") && value.contains("-----END CERTIFICATE-----")) {
            return;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(value.replaceAll("\\s+", ""));
            if (decoded.length > 0) {
                return;
            }
        } catch (IllegalArgumentException ignored) {
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "Certificate must be PEM or Base64 DER encoded");
    }
}
