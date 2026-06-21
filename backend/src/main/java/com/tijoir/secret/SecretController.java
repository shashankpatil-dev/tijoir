package com.tijoir.secret;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.securitycontrol.IdempotencyService;
import com.tijoir.securitycontrol.IdempotentResponse;
import com.tijoir.secret.dto.CreateSecretRequest;
import com.tijoir.secret.dto.GenerateSecretRequest;
import com.tijoir.secret.dto.GeneratedSecretResponse;
import com.tijoir.secret.dto.RevealSecretResponse;
import com.tijoir.secret.dto.RotateSecretRequest;
import com.tijoir.secret.dto.SecretDetailResponse;
import com.tijoir.secret.dto.SecretSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/secrets")
public class SecretController {
    private final SecretService secretService;
    private final IdempotencyService idempotencyService;

    public SecretController(SecretService secretService, IdempotencyService idempotencyService) {
        this.secretService = secretService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<SecretDetailResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateSecretRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        IdempotentResponse<SecretDetailResponse> response = idempotencyService.execute(
                user,
                "secret-create",
                idempotencyKey,
                request,
                SecretDetailResponse.class,
                () -> IdempotentResponse.created(secretService.create(user, request))
        );
        return ResponseEntity.status(response.status()).body(response.body());
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

    @PostMapping("/{secretId}/reveal")
    public RevealSecretResponse reveal(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId
    ) {
        return secretService.reveal(user, secretId);
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
            @Valid @RequestBody RotateSecretRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        IdempotentResponse<SecretDetailResponse> response = idempotencyService.execute(
                user,
                "secret-rotate",
                idempotencyKey,
                Map.of("secretId", secretId, "request", request),
                SecretDetailResponse.class,
                () -> IdempotentResponse.ok(secretService.rotate(user, secretId, request))
        );
        return ResponseEntity.status(response.status()).body(response.body());
    }
}
