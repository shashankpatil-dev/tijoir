package com.tijoir.auth;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.security.JwtService;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.notification.NotificationProperties;
import com.tijoir.notification.NotificationService;
import com.tijoir.auth.dto.OrganizationSummary;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.auth.dto.RegisterResponse;
import com.tijoir.auth.dto.UserSummary;
import com.tijoir.auth.dto.VerificationResponse;
import com.tijoir.organization.Organization;
import com.tijoir.organization.OrganizationRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AuthService {
    private final OrganizationRepository organizationRepository;
    private final UserAccountRepository userAccountRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private static final long PASSWORD_RESET_EXP_MINUTES = 30;
    private final JwtService jwtService;
    private final NotificationService notificationService;
    private final NotificationProperties notificationProperties;
    private final long verificationExpirationMinutes;
    private final long refreshTokenExpirationDays;

    public AuthService(
            OrganizationRepository organizationRepository,
            UserAccountRepository userAccountRepository,
            EmailVerificationTokenRepository verificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            NotificationService notificationService,
            NotificationProperties notificationProperties,
            @Value("${tijoir.security.email-verification-expiration-minutes}") long verificationExpirationMinutes,
            @Value("${tijoir.security.refresh-token-expiration-days}") long refreshTokenExpirationDays
    ) {
        this.organizationRepository = organizationRepository;
        this.userAccountRepository = userAccountRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.notificationService = notificationService;
        this.notificationProperties = notificationProperties;
        this.verificationExpirationMinutes = verificationExpirationMinutes;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String userEmail = normalizeEmail(request.userEmail());
        // Organization email is optional; default it to the owner's email (two-step signup).
        String organizationEmail = request.organizationEmail() != null && !request.organizationEmail().isBlank()
                ? normalizeEmail(request.organizationEmail())
                : userEmail;

        if (organizationRepository.existsByEmailIgnoreCase(organizationEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Organization email is already registered");
        }
        if (userAccountRepository.existsByEmailIgnoreCaseAndDeactivatedAtIsNull(userEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "User email is already registered");
        }

        Organization organization = organizationRepository.save(new Organization(
                request.organizationName().trim(),
                uniqueSlug(request.organizationName()),
                organizationEmail
        ));
        UserAccount user = userAccountRepository.save(new UserAccount(
                organization,
                request.userName().trim(),
                userEmail,
                passwordEncoder.encode(request.password()),
                UserRole.ORG_OWNER
        ));
        VerificationTokenResult verification = createVerificationToken(user);
        notificationService.recordVerificationRequested(user, verification.rawToken(), verification.expiresAt(), false);

        return new RegisterResponse(
                null,
                true,
                true,
                notificationProperties.isExposeDevTokens() ? verification.rawToken() : null,
                verification.expiresAt()
        );
    }

    @Transactional
    public IssuedSession login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureActive(user);
        return issueAuthResponse(user, true);
    }

    @Transactional
    public IssuedSession issueSessionForUser(UserAccount user) {
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureActive(user);
        return issueAuthResponse(user, true);
    }

    @Transactional(readOnly = true)
    public AuthResponse currentUser(UUID userId) {
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        return issueAuthResponse(user, false).authResponse();
    }

    @Transactional
    public IssuedSession refresh(String rawRefreshToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(CryptoUtil.sha256Hex(rawRefreshToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (!refreshToken.isUsable(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserAccount user = refreshToken.getUser();
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureActive(user);

        refreshToken.consume();
        return issueAuthResponse(user, true);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(CryptoUtil.sha256Hex(rawRefreshToken.trim()))
                .ifPresent(RefreshToken::revoke);
    }

    @Transactional
    public VerificationResponse verifyEmail(String rawToken) {
        String tokenHash = CryptoUtil.sha256Hex(rawToken);
        EmailVerificationToken token = verificationTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification token"));

        if (token.isConsumed()) {
            return new VerificationResponse(true, "Email is already verified");
        }
        if (token.isExpired(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification token has expired");
        }

        token.getUser().markEmailVerified();
        token.consume();
        return new VerificationResponse(true, "Email verified");
    }

    @Transactional
    public RegisterResponse resendVerification(String email) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getEmailVerifiedAt() != null) {
            return new RegisterResponse(null, false, false, null, null);
        }
        VerificationTokenResult verification = createVerificationToken(user);
        notificationService.recordVerificationRequested(user, verification.rawToken(), verification.expiresAt(), true);
        return new RegisterResponse(
                null,
                true,
                true,
                notificationProperties.isExposeDevTokens() ? verification.rawToken() : null,
                verification.expiresAt()
        );
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Generic behavior: do the work only if the user exists, but the caller always
        // responds identically so this endpoint cannot be used to enumerate accounts.
        userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(normalizeEmail(email))
                .ifPresent(user -> {
                    String rawToken = CryptoUtil.randomUrlToken(32);
                    Instant expiresAt = Instant.now().plusSeconds(PASSWORD_RESET_EXP_MINUTES * 60);
                    passwordResetTokenRepository.save(
                            new PasswordResetToken(user, CryptoUtil.sha256Hex(rawToken), expiresAt));
                    notificationService.recordPasswordResetRequested(user, rawToken, expiresAt);
                });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(CryptoUtil.sha256Hex(rawToken))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link"));
        if (token.isConsumed() || token.isExpired(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired reset link");
        }

        UserAccount user = token.getUser();
        user.changePassword(passwordEncoder.encode(newPassword));
        token.consume();
        // Kill any existing sessions after a password reset.
        for (RefreshToken refreshToken : refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(user.getId())) {
            refreshToken.revoke();
        }
    }

    private IssuedSession issueAuthResponse(UserAccount user, boolean includeRefreshToken) {
        ensureActive(user);
        JwtService.TokenResult accessToken = jwtService.issueToken(user);
        RefreshTokenResult refreshToken = includeRefreshToken ? createRefreshToken(user) : null;

        return new IssuedSession(new AuthResponse(
                accessToken.token(),
                null,
                "Bearer",
                accessToken.expiresAt(),
                refreshToken != null ? refreshToken.expiresAt() : null,
                userSummary(user),
                organizationSummary(user.getOrganization())
        ), refreshToken != null ? refreshToken.rawToken() : null);
    }

    private UserSummary userSummary(UserAccount user) {
        return new UserSummary(
                user.getId(),
                user.getOrganization().getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerifiedAt() != null,
                user.getCreatedAt()
        );
    }

    private OrganizationSummary organizationSummary(Organization organization) {
        return new OrganizationSummary(
                organization.getId(),
                organization.getName(),
                organization.getSlug(),
                organization.getEmail()
        );
    }

    private VerificationTokenResult createVerificationToken(UserAccount user) {
        String rawToken = CryptoUtil.randomUrlToken(32);
        Instant expiresAt = Instant.now().plusSeconds(verificationExpirationMinutes * 60);
        verificationTokenRepository.save(new EmailVerificationToken(user, CryptoUtil.sha256Hex(rawToken), expiresAt));
        return new VerificationTokenResult(rawToken, expiresAt);
    }

    private RefreshTokenResult createRefreshToken(UserAccount user) {
        String rawToken = CryptoUtil.randomUrlToken(48);
        Instant expiresAt = Instant.now().plusSeconds(refreshTokenExpirationDays * 24 * 60 * 60);
        refreshTokenRepository.save(new RefreshToken(user, CryptoUtil.sha256Hex(rawToken), expiresAt));
        return new RefreshTokenResult(rawToken, expiresAt);
    }

    private String uniqueSlug(String name) {
        String base = slugify(name);
        String slug = base;
        int counter = 2;
        while (organizationRepository.existsBySlug(slug)) {
            slug = base + "-" + counter;
            counter++;
        }
        return slug;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (normalized.isBlank()) {
            return "org-" + UUID.randomUUID().toString().substring(0, 8);
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private void ensureActive(UserAccount user) {
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists");
        }
    }

    private record VerificationTokenResult(String rawToken, Instant expiresAt) {
    }

    private record RefreshTokenResult(String rawToken, Instant expiresAt) {
    }

    public record IssuedSession(AuthResponse authResponse, String rawRefreshToken) {
    }
}
