package com.tijoir.organization;

import com.tijoir.common.util.CryptoUtil;
import com.tijoir.organization.dto.OrganizationPolicyResponse;
import com.tijoir.securitycontrol.ReadModelCacheService;
import com.tijoir.securitycontrol.RedisSecurityProperties;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
public class OrganizationPolicyCacheService {
    private final OrganizationPolicyRepository organizationPolicyRepository;
    private final ReadModelCacheService readModelCacheService;
    private final RedisSecurityProperties redisSecurityProperties;

    public OrganizationPolicyCacheService(
            OrganizationPolicyRepository organizationPolicyRepository,
            ReadModelCacheService readModelCacheService,
            RedisSecurityProperties redisSecurityProperties
    ) {
        this.organizationPolicyRepository = organizationPolicyRepository;
        this.readModelCacheService = readModelCacheService;
        this.redisSecurityProperties = redisSecurityProperties;
    }

    public OrganizationPolicyResponse getPolicyResponse(UUID organizationId) {
        if (!cacheEnabled()) {
            return loadPolicyResponse(organizationId);
        }

        String cacheKey = cacheKey(organizationId);
        return readModelCacheService.get(cacheKey, OrganizationPolicyResponse.class)
                .orElseGet(() -> {
                    OrganizationPolicyResponse response = loadPolicyResponse(organizationId);
                    readModelCacheService.put(
                            cacheKey,
                            response,
                            Duration.ofSeconds(redisSecurityProperties.getPolicyCache().getTtlSeconds())
                    );
                    return response;
                });
    }

    public void evict(UUID organizationId) {
        if (cacheEnabled()) {
            readModelCacheService.evict(cacheKey(organizationId));
        }
    }

    public OrganizationPolicyResponse toResponse(OrganizationPolicy policy) {
        if (policy == null) {
            return new OrganizationPolicyResponse(
                    null,
                    false,
                    true,
                    true,
                    true,
                    30,
                    null
            );
        }
        return new OrganizationPolicyResponse(
                policy.getDefaultShareLinkExpiryHours(),
                policy.isRequireVendorContractForShareLinks(),
                policy.isAllowViewOnce(),
                policy.isAllowViewUntilRevoked(),
                policy.isAllowRotationNotifyOnly(),
                policy.getRotationReminderDays(),
                policy.getUpdatedAt()
        );
    }

    private OrganizationPolicyResponse loadPolicyResponse(UUID organizationId) {
        return toResponse(organizationPolicyRepository.findByOrganizationId(organizationId).orElse(null));
    }

    private boolean cacheEnabled() {
        return redisSecurityProperties.isEnabled() && redisSecurityProperties.getPolicyCache().isEnabled();
    }

    private String cacheKey(UUID organizationId) {
        return "tijoir:read-model:policy:%s".formatted(CryptoUtil.sha256Hex(organizationId.toString()));
    }
}
