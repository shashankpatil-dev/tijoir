package com.tijoir.auth;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.dto.WorkspaceMembershipSummary;
import com.tijoir.auth.security.GoogleTokenVerifier;
import com.tijoir.auth.security.JwtService;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
import com.tijoir.identity.IdentityUser;
import com.tijoir.identity.IdentityUserRepository;
import com.tijoir.identity.OrganizationMembership;
import com.tijoir.identity.OrganizationMembershipRepository;
import com.tijoir.notification.NotificationProperties;
import com.tijoir.notification.NotificationService;
import com.tijoir.auth.dto.OrganizationSummary;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.auth.dto.RegisterResponse;
import com.tijoir.auth.dto.UserSummary;
import com.tijoir.auth.dto.VerificationResponse;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.organization.Organization;
import com.tijoir.organization.OrganizationRepository;
import com.tijoir.organization.UserAccount;
import com.tijoir.organization.UserAccountRepository;
import com.tijoir.organization.UserRole;
import com.tijoir.identity.IdentityMembershipSyncService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final OrganizationRepository organizationRepository;
    private final UserAccountRepository userAccountRepository;
    private final IdentityUserRepository identityUserRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private static final long PASSWORD_RESET_EXP_MINUTES = 30;
    private final JwtService jwtService;
    private final GoogleTokenVerifier googleTokenVerifier;
    private final NotificationService notificationService;
    private final NotificationProperties notificationProperties;
    private final IdentityMembershipSyncService identityMembershipSyncService;
    private final long verificationExpirationMinutes;
    private final long refreshTokenExpirationDays;

    public AuthService(
            OrganizationRepository organizationRepository,
            UserAccountRepository userAccountRepository,
            IdentityUserRepository identityUserRepository,
            OrganizationMembershipRepository organizationMembershipRepository,
            EmailVerificationTokenRepository verificationTokenRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenVerifier googleTokenVerifier,
            NotificationService notificationService,
            NotificationProperties notificationProperties,
            IdentityMembershipSyncService identityMembershipSyncService,
            @Value("${tijoir.security.email-verification-expiration-minutes}") long verificationExpirationMinutes,
            @Value("${tijoir.security.refresh-token-expiration-days}") long refreshTokenExpirationDays
    ) {
        this.organizationRepository = organizationRepository;
        this.userAccountRepository = userAccountRepository;
        this.identityUserRepository = identityUserRepository;
        this.organizationMembershipRepository = organizationMembershipRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenVerifier = googleTokenVerifier;
        this.notificationService = notificationService;
        this.notificationProperties = notificationProperties;
        this.identityMembershipSyncService = identityMembershipSyncService;
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
        if (identityUserRepository.findByEmailIgnoreCase(userEmail).isPresent()) {
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
        identityMembershipSyncService.mirrorLegacyUser(user);
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
        IdentityUser identityUser = identityUserRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (identityUser.getPasswordHash() == null || !passwordEncoder.matches(request.password(), identityUser.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (identityUser.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureIdentityActive(identityUser);
        UserAccount user = resolveDefaultWorkspaceUser(identityUser);
        return issueAuthResponse(user, identityUser, true);
    }

    @Transactional
    public IssuedSession issueSessionForUser(UserAccount user) {
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(user.getId());
        if (identityUser.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureIdentityActive(identityUser);
        ensureActive(user);
        return issueAuthResponse(user, identityUser, true);
    }

    @Transactional
    public AuthResponse currentUser(AuthenticatedUser principal) {
        UserAccount user = userAccountRepository.findByIdAndOrganizationIdAndDeactivatedAtIsNull(
                        principal.userId(),
                        principal.organizationId()
                )
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        IdentityUser identityUser = findIdentityByIdOrThrow(principal.identityUserId());
        return issueAuthResponse(user, identityUser, false).authResponse();
    }

    @Transactional
    public IssuedSession refresh(String rawRefreshToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(CryptoUtil.sha256Hex(rawRefreshToken))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (!refreshToken.isUsable(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserAccount user = refreshToken.getUser();
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(user.getId());
        if (identityUser.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        ensureIdentityActive(identityUser);
        ensureActive(user);

        refreshToken.consume();
        return issueAuthResponse(user, identityUser, true);
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
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(token.getUser().getId());
        identityUser.markEmailVerified();
        identityUserRepository.save(identityUser);
        propagateIdentityProfile(identityUser);
        token.consume();
        return new VerificationResponse(true, "Email verified");
    }

    @Transactional
    public RegisterResponse resendVerification(String email) {
        IdentityUser identityUser = identityUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        UserAccount user = resolveDefaultWorkspaceUser(identityUser);
        if (identityUser.getEmailVerifiedAt() != null) {
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

        Optional<IdentityUser> bySub = identityUserRepository.findByGoogleSub(identity.sub());
        if (bySub.isPresent()) {
            return new GoogleOutcome(false, issueAuthResponse(resolveDefaultWorkspaceUser(bySub.get()), bySub.get(), true));
        }

        Optional<IdentityUser> byEmail = identityUserRepository.findByEmailIgnoreCase(email);
        if (byEmail.isPresent()) {
            IdentityUser identityUser = byEmail.get();
            identityUser.linkGoogle(identity.sub());
            identityUser.markEmailVerified();
            identityUserRepository.save(identityUser);
            propagateIdentityProfile(identityUser);
            return new GoogleOutcome(false, issueAuthResponse(resolveDefaultWorkspaceUser(identityUser), identityUser, true));
        }

        return new GoogleOutcome(true, null);
    }

    @Transactional
    public IssuedSession googleRegister(String idToken, String organizationName) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(idToken);
        String email = normalizeEmail(identity.email());
        if (identityUserRepository.findByEmailIgnoreCase(email).isPresent()) {
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
        identityMembershipSyncService.mirrorLegacyUser(user);
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(user.getId());
        identityUser.linkGoogle(identity.sub());
        identityUser.markEmailVerified();
        identityUserRepository.save(identityUser);
        return issueAuthResponse(user, identityUser, true);
    }

    @Transactional
    public IssuedSession switchOrganization(AuthenticatedUser principal, UUID organizationId) {
        IdentityUser identityUser = findIdentityByIdOrThrow(principal.identityUserId());
        ensureIdentityActive(identityUser);
        OrganizationMembership membership = requireActiveMembership(identityUser.getId(), organizationId);
        UserAccount user = resolveWorkspaceUser(membership, identityUser);
        return issueAuthResponse(user, identityUser, true);
    }

    @Transactional
    public void linkGoogle(UUID userId, String idToken) {
        GoogleTokenVerifier.GoogleIdentity identity = googleTokenVerifier.verify(idToken);
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(userId);
        identityUserRepository.findByGoogleSub(identity.sub())
                .filter(other -> !other.getId().equals(identityUser.getId()))
                .ifPresent(other -> {
                    throw new ApiException(HttpStatus.CONFLICT, "This Google account is already linked to another user");
                });
        identityUser.linkGoogle(identity.sub());
        identityUserRepository.save(identityUser);
    }

    @Transactional
    public AuthResponse updateName(UUID userId, String name) {
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(userId);
        identityUser.rename(name.trim());
        identityUserRepository.save(identityUser);
        propagateIdentityProfile(identityUser);
        UserAccount user = userAccountRepository.findByIdAndDeactivatedAtIsNull(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return issueAuthResponse(user, identityUser, false).authResponse();
    }

    @Transactional
    public void changePassword(UUID userId, String currentPassword, String newPassword) {
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(userId);
        // Users with an existing password must confirm it. Google-only users (no password yet)
        // can set one without a current password.
        if (identityUser.getPasswordHash() != null
                && (currentPassword == null || !passwordEncoder.matches(currentPassword, identityUser.getPasswordHash()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        String encoded = passwordEncoder.encode(newPassword);
        identityUser.changePassword(encoded);
        identityUserRepository.save(identityUser);
        propagateIdentityProfile(identityUser);
        for (UserAccount account : userAccountRepository.findAllByEmailIgnoreCaseAndDeactivatedAtIsNull(identityUser.getEmail())) {
            for (RefreshToken refreshToken : refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(account.getId())) {
                refreshToken.revoke();
            }
        }
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Generic behavior: do the work only if the user exists, but the caller always
        // responds identically so this endpoint cannot be used to enumerate accounts.
        identityUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .ifPresent(identityUser -> {
                    UserAccount user = resolveDefaultWorkspaceUser(identityUser);
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
        IdentityUser identityUser = findIdentityByLegacyUserOrThrow(user.getId());
        identityUser.changePassword(passwordEncoder.encode(newPassword));
        identityUserRepository.save(identityUser);
        propagateIdentityProfile(identityUser);
        token.consume();
        // Kill any existing sessions after a password reset.
        for (UserAccount account : userAccountRepository.findAllByEmailIgnoreCaseAndDeactivatedAtIsNull(identityUser.getEmail())) {
            for (RefreshToken refreshToken : refreshTokenRepository.findByUser_IdAndRevokedAtIsNull(account.getId())) {
                refreshToken.revoke();
            }
        }
    }

    private IssuedSession issueAuthResponse(UserAccount user, IdentityUser identityUser, boolean includeRefreshToken) {
        ensureActive(user);
        ensureIdentityActive(identityUser);
        if (!user.getId().equals(identityUser.getLegacyUserId())) {
            identityUser.preferLegacyUser(user.getId());
            identityUserRepository.save(identityUser);
        }
        JwtService.TokenResult accessToken = jwtService.issueToken(identityUser, user);
        RefreshTokenResult refreshToken = includeRefreshToken ? createRefreshToken(user) : null;

        return new IssuedSession(new AuthResponse(
                accessToken.token(),
                null,
                "Bearer",
                accessToken.expiresAt(),
                refreshToken != null ? refreshToken.expiresAt() : null,
                userSummary(user, identityUser),
                organizationSummary(user.getOrganization()),
                membershipSummaries(identityUser.getId(), user.getOrganization().getId())
        ), refreshToken != null ? refreshToken.rawToken() : null);
    }

    private UserSummary userSummary(UserAccount user, IdentityUser identityUser) {
        return new UserSummary(
                user.getId(),
                identityUser.getId(),
                user.getOrganization().getId(),
                identityUser.getName(),
                identityUser.getEmail(),
                user.getRole(),
                identityUser.getEmailVerifiedAt() != null,
                user.getCreatedAt()
        );
    }

    private List<WorkspaceMembershipSummary> membershipSummaries(UUID identityUserId, UUID activeOrganizationId) {
        return organizationMembershipRepository.findAllByIdentityUserIdOrderByJoinedAtAsc(identityUserId).stream()
                .filter(OrganizationMembership::isActive)
                .sorted(Comparator.comparing(OrganizationMembership::getJoinedAt))
                .map(membership -> new WorkspaceMembershipSummary(
                        membership.getOrganization().getId(),
                        membership.getLegacyUserId(),
                        membership.getOrganization().getName(),
                        membership.getOrganization().getSlug(),
                        membership.getOrganization().getEmail(),
                        membership.getRole(),
                        membership.getOrganization().getId().equals(activeOrganizationId),
                        membership.getJoinedAt()
                ))
                .toList();
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

    private void ensureIdentityActive(IdentityUser identityUser) {
        if (!identityUser.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists");
        }
    }

    private IdentityUser findIdentityByIdOrThrow(UUID identityUserId) {
        return identityUserRepository.findById(identityUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    private IdentityUser findIdentityByLegacyUserOrThrow(UUID legacyUserId) {
        return identityUserRepository.findByLegacyUserId(legacyUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    private UserAccount resolveDefaultWorkspaceUser(IdentityUser identityUser) {
        List<OrganizationMembership> memberships = organizationMembershipRepository.findAllByIdentityUserIdOrderByJoinedAtAsc(identityUser.getId())
                .stream()
                .filter(OrganizationMembership::isActive)
                .toList();
        if (memberships.isEmpty()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists");
        }

        OrganizationMembership preferred = memberships.stream()
                .filter(membership -> membership.getLegacyUserId() != null && membership.getLegacyUserId().equals(identityUser.getLegacyUserId()))
                .findFirst()
                .orElse(memberships.get(0));
        return resolveWorkspaceUser(preferred, identityUser);
    }

    private OrganizationMembership requireActiveMembership(UUID identityUserId, UUID organizationId) {
        OrganizationMembership membership = organizationMembershipRepository.findByIdentityUserIdAndOrganizationId(identityUserId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "You do not belong to the requested organization"));
        if (!membership.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not belong to the requested organization");
        }
        return membership;
    }

    private UserAccount resolveWorkspaceUser(OrganizationMembership membership, IdentityUser identityUser) {
        if (membership.getLegacyUserId() != null) {
            return userAccountRepository.findByIdAndOrganizationIdAndDeactivatedAtIsNull(
                            membership.getLegacyUserId(),
                            membership.getOrganization().getId()
                    )
                    .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        }

        Optional<UserAccount> existing = userAccountRepository.findByOrganizationIdAndEmailIgnoreCaseAndDeactivatedAtIsNull(
                membership.getOrganization().getId(),
                identityUser.getEmail()
        );
        if (existing.isPresent()) {
            return existing.get();
        }

        UserAccount user = new UserAccount(
                membership.getOrganization(),
                identityUser.getName(),
                identityUser.getEmail(),
                identityUser.getPasswordHash(),
                membership.getRole()
        );
        if (identityUser.getEmailVerifiedAt() != null) {
            user.markEmailVerified();
        }
        userAccountRepository.save(user);
        identityMembershipSyncService.mirrorLegacyUser(user);
        return user;
    }

    private void propagateIdentityProfile(IdentityUser identityUser) {
        for (UserAccount user : userAccountRepository.findAllByEmailIgnoreCaseAndDeactivatedAtIsNull(identityUser.getEmail())) {
            user.rename(identityUser.getName());
            user.changePassword(identityUser.getPasswordHash());
            if (identityUser.getEmailVerifiedAt() != null) {
                user.markEmailVerified();
            }
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
