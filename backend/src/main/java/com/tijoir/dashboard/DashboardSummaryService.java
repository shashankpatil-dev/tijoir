package com.tijoir.dashboard;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.connection.VendorRepository;
import com.tijoir.organization.OrganizationAuthorizationService;
import com.tijoir.organization.OrganizationInviteRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import com.tijoir.secret.VaultSecret;
import com.tijoir.secret.VaultSecretRepository;
import com.tijoir.secret.dto.SecretSummaryResponse;
import com.tijoir.securitycontrol.ReadModelCacheService;
import com.tijoir.securitycontrol.RedisSecurityProperties;
import com.tijoir.sharelink.ShareLinkRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class DashboardSummaryService {
    private final VaultSecretRepository vaultSecretRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final VendorRepository vendorRepository;
    private final UserAccountRepository userAccountRepository;
    private final OrganizationInviteRepository organizationInviteRepository;
    private final OrganizationAuthorizationService organizationAuthorizationService;
    private final ReadModelCacheService readModelCacheService;
    private final RedisSecurityProperties redisSecurityProperties;

    public DashboardSummaryService(
            VaultSecretRepository vaultSecretRepository,
            ShareLinkRepository shareLinkRepository,
            VendorRepository vendorRepository,
            UserAccountRepository userAccountRepository,
            OrganizationInviteRepository organizationInviteRepository,
            OrganizationAuthorizationService organizationAuthorizationService,
            ReadModelCacheService readModelCacheService,
            RedisSecurityProperties redisSecurityProperties
    ) {
        this.vaultSecretRepository = vaultSecretRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.vendorRepository = vendorRepository;
        this.userAccountRepository = userAccountRepository;
        this.organizationInviteRepository = organizationInviteRepository;
        this.organizationAuthorizationService = organizationAuthorizationService;
        this.readModelCacheService = readModelCacheService;
        this.redisSecurityProperties = redisSecurityProperties;
    }

    public DashboardSummaryResponse getSummary(AuthenticatedUser principal) {
        UserAccount actor = organizationAuthorizationService.requireActor(principal);
        UUID organizationId = actor.getOrganization().getId();
        if (!cacheEnabled()) {
            return loadSummary(actor);
        }

        String cacheKey = cacheKey(organizationId);
        return readModelCacheService.get(cacheKey, DashboardSummaryResponse.class)
                .orElseGet(() -> {
                    DashboardSummaryResponse response = loadSummary(actor);
                    readModelCacheService.put(
                            cacheKey,
                            response,
                            Duration.ofSeconds(redisSecurityProperties.getSummaryCache().getTtlSeconds())
                    );
                    return response;
                });
    }

    public void evict(UUID organizationId) {
        if (cacheEnabled()) {
            readModelCacheService.evict(cacheKey(organizationId));
        }
    }

    private DashboardSummaryResponse loadSummary(UserAccount actor) {
        UUID organizationId = actor.getOrganization().getId();
        boolean organizationManager = actor.getRole() == UserRole.ORG_OWNER || actor.getRole() == UserRole.ADMIN;

        return new DashboardSummaryResponse(
                vaultSecretRepository.countByOrganizationId(organizationId),
                shareLinkRepository.countActiveByOrganizationId(organizationId, Instant.now()),
                vendorRepository.countByOrganizationId(organizationId),
                organizationManager ? userAccountRepository.countByOrganizationIdAndDeactivatedAtIsNull(organizationId) : 0,
                organizationManager ? organizationInviteRepository.countPendingByOrganizationId(organizationId, Instant.now()) : 0,
                vaultSecretRepository.findFirstByOrganizationIdOrderByCreatedAtDesc(organizationId)
                        .map(this::toSecretSummary)
                        .orElse(null)
        );
    }

    private SecretSummaryResponse toSecretSummary(VaultSecret secret) {
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

    private boolean cacheEnabled() {
        return redisSecurityProperties.isEnabled() && redisSecurityProperties.getSummaryCache().isEnabled();
    }

    private String cacheKey(UUID organizationId) {
        return "tijoir:read-model:summary:%s".formatted(CryptoUtil.sha256Hex(organizationId.toString()));
    }
}
