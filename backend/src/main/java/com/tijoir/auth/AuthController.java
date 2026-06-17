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
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    public AuthController(AuthService authService, AuthCookieService authCookieService) {
        this.authService = authService;
        this.authCookieService = authCookieService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return sessionResponse(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody(required = false) RefreshRequest request,
            HttpServletRequest httpServletRequest
    ) {
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
    public VerificationResponse verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return authService.verifyEmail(request.token());
    }

    @PostMapping("/resend-verification")
    public RegisterResponse resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        return authService.resendVerification(request.email());
    }

    private ResponseEntity<AuthResponse> sessionResponse(AuthService.IssuedSession issuedSession) {
        HttpHeaders headers = new HttpHeaders();
        authCookieService.writeRefreshCookie(headers, issuedSession.rawRefreshToken(), issuedSession.authResponse().refreshExpiresAt());
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
