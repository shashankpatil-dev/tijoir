package com.tijoir.auth;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.security.GoogleTokenVerifier;
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
import java.util.Optional;
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
    private final GoogleTokenVerifier googleTokenVerifier;
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
            GoogleTokenVerifier googleTokenVerifier,
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
        this.googleTokenVerifier = googleTokenVerifier;
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
    public GoogleOutcome googleExchange(String idToken) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(idToken);
        String email = normalizeEmail(identity.email());

        Optional<UserAccount> bySub = userAccountRepository.findByGoogleSubAndDeactivatedAtIsNull(identity.sub());
        if (bySub.isPresent()) {
            return new GoogleOutcome(false, issueSessionForUser(bySub.get()));
        }

        Optional<UserAccount> byEmail = userAccountRepository.findByEmailIgnoreCaseAndDeactivatedAtIsNull(email);
        if (byEmail.isPresent()) {
            UserAccount user = byEmail.get();
            user.linkGoogle(identity.sub());
            user.markEmailVerified();
            return new GoogleOutcome(false, issueSessionForUser(user));
        }

        return new GoogleOutcome(true, null);
    }

    @Transactional
    public IssuedSession googleRegister(String idToken, String organizationName) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(idToken);
        String email = normalizeEmail(identity.email());
        if (userAccountRepository.existsByEmailIgnoreCaseAndDeactivatedAtIsNull(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists. Try signing in.");
        }

        Organization organization = organizationRepository.save(new Organization(
                organizationName.trim(),
                uniqueSlug(organizationName),
                email
        ));
        UserAccount user = new UserAccount(organization, identity.name(), email, null, UserRole.ORG_OWNER);
        user.linkGoogle(identity.sub());
        user.markEmailVerified();
        userAccountRepository.save(user);
        return issueAuthResponse(user, true);
    }

    @Transactional
    public void linkGoogle(UUID userId, String idToken) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(idToken);
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        userAccountRepository.findByGoogleSubAndDeactivatedAtIsNull(identity.sub())
                .filter(other -> !other.getId().equals(userId))
                .ifPresent(other -> {
                    throw new ApiException(HttpStatus.CONFLICT, "This Google account is already linked to another user");
                });
        user.linkGoogle(identity.sub());
    }

    @Transactional
    public AuthResponse updateName(UUID userId, String name) {
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        user.rename(name.trim());
        return issueAuthResponse(user, false).authResponse();
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        // Users with an existing password must confirm it. Google-only users (no password yet)
        // can set one without a current password.
        if (user.getPasswordHash() != null
                && (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPasswordHash()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.changePassword(passwordEncoder.encode(newPassword));
        for (RefreshToken refreshToken : refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(user.getId())) {
            refreshToken.revoke();
        }
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

    public record GoogleOutcome(boolean needsOrganization, IssuedSession session) {
    }
}
