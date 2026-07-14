package com.tijoir.secret;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.secret.dto.CreateSecretRequest;
import com.tijoir.secret.dto.GenerateSecretRequest;
import com.tijoir.secret.dto.GeneratedSecretResponse;
import com.tijoir.secret.dto.RevealSecretResponse;
import com.tijoir.secret.dto.RotateSecretRequest;
import com.tijoir.secret.dto.SecretDetailResponse;
import com.tijoir.secret.dto.SecretSummaryResponse;
import com.tijoir.secret.dto.SecretVersionResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/secrets")
public class SecretController {
    private final SecretService secretService;

    public SecretController(SecretService secretService) {
        this.secretService = secretService;
    }

    @PostMapping
    public ResponseEntity<SecretDetailResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateSecretRequest request
    ) {
        return ResponseEntity.status(201).body(secretService.create(user, request));
    }

    @PostMapping("/generate")
    public GeneratedSecretResponse generate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody GenerateSecretRequest request
    ) {
        return secretService.generate(user, request);
    }

    @GetMapping
    public PageResponse<SecretSummaryResponse> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) SecretType type,
            @RequestParam(required = false) SecretStatus status
    ) {
        return secretService.list(user, page, size, query, type, status);
    }

    @GetMapping("/{secretId}")
    public SecretDetailResponse get(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId
    ) {
        return secretService.get(user, secretId);
    }

    @GetMapping("/{secretId}/versions")
    public List<SecretVersionResponse> versions(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId
    ) {
        return secretService.listVersions(user, secretId);
    }

    @PostMapping("/{secretId}/reveal")
    public ResponseEntity<RevealSecretResponse> reveal(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId
    ) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .body(secretService.reveal(user, secretId));
    }

    @PostMapping("/{secretId}/revoke")
    public SecretDetailResponse revoke(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId
    ) {
        return secretService.revoke(user, secretId);
    }

    @PostMapping("/{secretId}/rotate")
    public ResponseEntity<SecretDetailResponse> rotate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId,
            @Valid @RequestBody RotateSecretRequest request
    ) {
        return ResponseEntity.ok(secretService.rotate(user, secretId, request));
    }
}
