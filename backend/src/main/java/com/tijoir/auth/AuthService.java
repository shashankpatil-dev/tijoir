package com.tijoir.auth;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.dto.OrganizationSummary;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.auth.dto.RegisterResponse;
import com.tijoir.auth.dto.UserSummary;
import com.tijoir.auth.dto.VerificationResponse;
import com.tijoir.auth.security.JwtService;
import com.tijoir.common.exception.ApiException;
import com.tijoir.common.util.CryptoUtil;
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
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long verificationExpirationMinutes;

    public AuthService(
            OrganizationRepository organizationRepository,
            UserAccountRepository userAccountRepository,
            EmailVerificationTokenRepository verificationTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${tijoir.security.email-verification-expiration-minutes}") long verificationExpirationMinutes
    ) {
        this.organizationRepository = organizationRepository;
        this.userAccountRepository = userAccountRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.verificationExpirationMinutes = verificationExpirationMinutes;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String organizationEmail = normalizeEmail(request.organizationEmail());
        String userEmail = normalizeEmail(request.userEmail());

        if (organizationRepository.existsByEmailIgnoreCase(organizationEmail)) {
            throw new ApiException(HttpStatus.CONFLICT, "Organization email is already registered");
        }
        if (userAccountRepository.existsByEmailIgnoreCase(userEmail)) {
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

        return new RegisterResponse(
                null,
                verification.rawToken(),
                verification.expiresAt()
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }
        if (user.getEmailVerifiedAt() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Email verification is required before login");
        }
        return authResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse currentUser(UUID userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
        return authResponse(user);
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
        UserAccount user = userAccountRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getEmailVerifiedAt() != null) {
            return new RegisterResponse(null, null, null);
        }
        VerificationTokenResult verification = createVerificationToken(user);
        return new RegisterResponse(null, verification.rawToken(), verification.expiresAt());
    }

    private AuthResponse authResponse(UserAccount user) {
        JwtService.TokenResult token = jwtService.issueToken(user);
        return new AuthResponse(
                token.token(),
                "Bearer",
                token.expiresAt(),
                userSummary(user),
                organizationSummary(user.getOrganization())
        );
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

    private record VerificationTokenResult(String rawToken, Instant expiresAt) {
    }
}
