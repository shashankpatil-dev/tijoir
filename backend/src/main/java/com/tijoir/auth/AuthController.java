package com.tijoir.auth;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.dto.LoginRequest;
import com.tijoir.auth.dto.RefreshRequest;
import com.tijoir.auth.dto.RegisterRequest;
import com.tijoir.auth.dto.RegisterResponse;
import com.tijoir.auth.dto.ResendVerificationRequest;
import com.tijoir.auth.dto.VerificationResponse;
import com.tijoir.auth.dto.VerifyEmailRequest;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.securitycontrol.AuthSecurityService;
import com.tijoir.securitycontrol.ClientIpResolver;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final AuthCookieService authCookieService;
    private final AuthSecurityService authSecurityService;
    private final ClientIpResolver clientIpResolver;

    public AuthController(
            AuthService authService,
            AuthCookieService authCookieService,
            AuthSecurityService authSecurityService,
            ClientIpResolver clientIpResolver
    ) {
        this.authService = authService;
        this.authCookieService = authCookieService;
        this.authSecurityService = authSecurityService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpServletRequest) {
        authSecurityService.assertRegisterAllowed(request, clientIpResolver.resolve(httpServletRequest));
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpServletRequest) {
        String clientIp = clientIpResolver.resolve(httpServletRequest);
        authSecurityService.assertLoginAllowed(request, clientIp);
        try {
            ResponseEntity<AuthResponse> response = sessionResponse(authService.login(request));
            authSecurityService.recordSuccessfulLogin(request, clientIp);
            return response;
        } catch (BadCredentialsException exception) {
            authSecurityService.recordFailedLogin(request, clientIp);
            throw exception;
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpServletRequest
    ) {
        authSecurityService.assertRefreshAllowed(clientIpResolver.resolve(httpServletRequest));
        String refreshToken = resolveRefreshToken(request, httpServletRequest);
        return sessionResponse(authService.refresh(refreshToken));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String refreshToken = resolveRefreshToken(request, httpServletRequest);
        authService.logout(refreshToken);
        HttpHeaders headers = new HttpHeaders();
        authCookieService.clearRefreshCookie(headers);
        return ResponseEntity.noContent()
                .headers(headers)
                .build();
    }

    @GetMapping("/me")
    public AuthResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.currentUser(user.userId());
    }

    @PostMapping("/verify-email")
    public VerificationResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request, HttpServletRequest httpServletRequest) {
        authSecurityService.assertVerifyEmailAllowed(request.token(), clientIpResolver.resolve(httpServletRequest));
        return authService.verifyEmail(request.token());
    }

    @PostMapping("/resend-verification")
    public RegisterResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request, HttpServletRequest httpServletRequest) {
        authSecurityService.assertResendVerificationAllowed(request.email(), clientIpResolver.resolve(httpServletRequest));
        return authService.resendVerification(request.email());
    }

    private ResponseEntity<AuthResponse> sessionResponse(AuthService.IssuedSession issuedSession) {
        HttpHeaders headers = new HttpHeaders();
        if (issuedSession.rawRefreshToken() != null && issuedSession.authResponse().refreshExpiresAt() != null) {
            authCookieService.writeRefreshCookie(headers, issuedSession.rawRefreshToken(), issuedSession.authResponse().refreshExpiresAt());
        }
        return ResponseEntity.ok()
                .headers(headers)
                .body(issuedSession.authResponse());
    }

    private String resolveRefreshToken(RefreshRequest request, HttpServletRequest httpServletRequest) {
        if (request != null && request.refreshToken() != null && !request.refreshToken().isBlank()) {
            return request.refreshToken().trim();
        }
        if (httpServletRequest.getCookies() == null) {
            return "";
        }
        for (jakarta.servlet.http.Cookie cookie : httpServletRequest.getCookies()) {
            if (authCookieService.refreshCookieName().equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return "";
    }
}
