package com.tijoir.auth.mfa;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.MfaChallengeVerifyRequest;
import com.tijoir.auth.dto.MfaDisableRequest;
import com.tijoir.auth.dto.MfaEnrollmentConfirmRequest;
import com.tijoir.auth.dto.MfaEnrollmentStartResponse;
import com.tijoir.auth.dto.MfaStatusResponse;
import com.tijoir.auth.dto.OrganizationSummary;
import com.tijoir.auth.dto.UserSummary;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.common.util.LocalSecretCrypto;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.securitycontrol.RedisSecurityProperties;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
public class MfaChallengeService {
    private static final int MAX_ATTEMPTS = 5;

    private final MfaChallengeStore mfaChallengeStore;
    private final MfaTotpService mfaTotpService;
    private final UserAccountRepository userAccountRepository;
    private final LocalSecretCrypto localSecretCrypto;
    private final PasswordEncoder passwordEncoder;
    private final RedisSecurityProperties redisSecurityProperties;

    public MfaChallengeService(
            MfaChallengeStore mfaChallengeStore,
            MfaTotpService mfaTotpService,
            UserAccountRepository userAccountRepository,
            LocalSecretCrypto localSecretCrypto,
            PasswordEncoder passwordEncoder,
            RedisSecurityProperties redisSecurityProperties
    ) {
        this.mfaChallengeStore = mfaChallengeStore;
        this.mfaTotpService = mfaTotpService;
        this.userAccountRepository = userAccountRepository;
        this.localSecretCrypto = localSecretCrypto;
        this.passwordEncoder = passwordEncoder;
        this.redisSecurityProperties = redisSecurityProperties;
    }

    public AuthResponse issueLoginChallenge(UserAccount user) {
        String rawChallengeId = CryptoUtil.randomUrlToken(24);
        StoredMfaChallenge challenge = new StoredMfaChallenge(
                user.getId(),
                user.getOrganization().getId(),
                MfaChallengePurpose.LOGIN,
                null,
                0,
                MAX_ATTEMPTS,
                Instant.now()
        );
        mfaChallengeStore.put(cacheKey(rawChallengeId), challenge, ttl());
        return new AuthResponse(
                null,
                null,
                null,
                null,
                null,
                userSummary(user),
                organizationSummary(user),
                true,
                rawChallengeId,
                Instant.now().plus(ttl())
        );
    }

    public MfaStatusResponse status(UUID userId) {
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        return new MfaStatusResponse(user.isMfaEnabled(), user.getMfaEnrolledAt());
    }

    public MfaEnrollmentStartResponse startEnrollment(UUID userId) {
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (user.isMfaEnabled()) {
            throw new ApiException(HttpStatus.CONFLICT, "MFA is already enabled for this account");
        }

        String rawChallengeId = CryptoUtil.randomUrlToken(24);
        String secret = mfaTotpService.generateSecret();
        mfaChallengeStore.put(
                cacheKey(rawChallengeId),
                new StoredMfaChallenge(
                        user.getId(),
                        user.getOrganization().getId(),
                        MfaChallengePurpose.ENROLLMENT,
                        localSecretCrypto.encrypt(secret),
                        0,
                        MAX_ATTEMPTS,
                        Instant.now()
                ),
                ttl()
        );

        return new MfaEnrollmentStartResponse(
                rawChallengeId,
                secret,
                mfaTotpService.otpauthUri("Tijoir", user.getEmail(), secret),
                Instant.now().plus(ttl())
        );
    }

    public MfaStatusResponse confirmEnrollment(UUID userId, UUID organizationId, MfaEnrollmentConfirmRequest request) {
        UserAccount user = findUser(userId, organizationId);
        StoredMfaChallenge challenge = loadChallenge(request.challengeId(), MfaChallengePurpose.ENROLLMENT, user);
        String secret = localSecretCrypto.decrypt(challenge.secretCiphertext());
        if (!mfaTotpService.verify(secret, request.code(), Instant.now())) {
            persistFailedAttempt(request.challengeId(), challenge, "Invalid MFA code");
        }
        user.enableMfa(challenge.secretCiphertext());
        mfaChallengeStore.delete(cacheKey(request.challengeId()));
        return new MfaStatusResponse(true, user.getMfaEnrolledAt());
    }

    public UserAccount verifyLoginChallenge(MfaChallengeVerifyRequest request) {
        StoredMfaChallenge challenge = getChallenge(request.challengeId());
        if (challenge.purpose() != MfaChallengePurpose.LOGIN) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid MFA challenge");
        }
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(challenge.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (!user.isMfaEnabled() || user.getMfaSecretCiphertext() == null) {
            mfaChallengeStore.delete(cacheKey(request.challengeId()));
            throw new ApiException(HttpStatus.UNAUTHORIZED, "MFA is not enabled for this account");
        }

        String secret = localSecretCrypto.decrypt(user.getMfaSecretCiphertext());
        if (!mfaTotpService.verify(secret, request.code(), Instant.now())) {
            persistFailedAttempt(request.challengeId(), challenge, "Invalid MFA code");
        }
        mfaChallengeStore.delete(cacheKey(request.challengeId()));
        return user;
    }

    public MfaStatusResponse disable(UUID userId, UUID organizationId, MfaDisableRequest request) {
        UserAccount user = findUser(userId, organizationId);
        if (!user.isMfaEnabled() || user.getMfaSecretCiphertext() == null) {
            return new MfaStatusResponse(false, null);
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }
        String secret = localSecretCrypto.decrypt(user.getMfaSecretCiphertext());
        if (!mfaTotpService.verify(secret, request.code(), Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid MFA code");
        }
        user.disableMfa();
        return new MfaStatusResponse(false, null);
    }

    private StoredMfaChallenge loadChallenge(String rawChallengeId, MfaChallengePurpose purpose, UserAccount user) {
        StoredMfaChallenge challenge = getChallenge(rawChallengeId);
        if (challenge == null || challenge.purpose() != purpose) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid MFA challenge");
        }
        if (!challenge.userId().equals(user.getId()) || !challenge.organizationId().equals(user.getOrganization().getId())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid MFA challenge");
        }
        return challenge;
    }

    private StoredMfaChallenge getChallenge(String rawChallengeId) {
        return mfaChallengeStore.get(cacheKey(rawChallengeId))
                .orElseThrow(() -> new ApiException(HttpStatus.GONE, "MFA challenge has expired or is no longer available"));
    }

    private void persistFailedAttempt(String rawChallengeId, StoredMfaChallenge challenge, String message) {
        StoredMfaChallenge updated = challenge.incrementAttempts();
        if (updated.exhausted()) {
            mfaChallengeStore.delete(cacheKey(rawChallengeId));
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "MFA challenge has been locked after too many failed attempts");
        }
        mfaChallengeStore.put(cacheKey(rawChallengeId), updated, ttl());
        throw new ApiException(HttpStatus.UNAUTHORIZED, message);
    }

    private Duration ttl() {
        long seconds = redisSecurityProperties.getMfa().getTtlSeconds();
        return Duration.ofSeconds(seconds > 0 ? seconds : 300);
    }

    private UserAccount findUser(UUID userId, UUID organizationId) {
        UserAccount user = userAccountRepository.findByIdAndOrganizationIdAndDeactivatedAtIsNull(userId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before MFA changes");
        }
        return user;
    }

    private String cacheKey(String rawChallengeId) {
        return "tijoir:mfa:challenge:%s".formatted(CryptoUtil.sha256Hex(rawChallengeId.trim()));
    }

    private UserSummary userSummary(UserAccount user) {
        return new UserSummary(
                user.getId(),
                user.getOrganization().getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerifiedAt() != null,
                user.isMfaEnabled(),
                user.getCreatedAt()
        );
    }

    private OrganizationSummary organizationSummary(UserAccount user) {
        return new OrganizationSummary(
                user.getOrganization().getId(),
                user.getOrganization().getName(),
                user.getOrganization().getSlug(),
                user.getOrganization().getEmail()
        );
    }
}
