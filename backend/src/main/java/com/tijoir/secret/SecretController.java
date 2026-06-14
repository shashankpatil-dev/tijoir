package com.tijoir.secret;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.secret.dto.CreateSecretRequest;
import com.tijoir.secret.dto.GenerateSecretRequest;
import com.tijoir.secret.dto.GeneratedSecretResponse;
import com.tijoir.secret.dto.RevealSecretResponse;
import com.tijoir.secret.dto.RotateSecretRequest;
import com.tijoir.secret.dto.SecretDetailResponse;
import com.tijoir.secret.dto.SecretSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
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
    @ResponseStatus(HttpStatus.CREATED)
    public SecretDetailResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateSecretRequest request
    ) {
        return secretService.create(user, request);
    }

    @PostMapping("/generate")
    public GeneratedSecretResponse generate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody GenerateSecretRequest request
    ) {
        return secretService.generate(user, request);
    }

    @GetMapping
    public List<SecretSummaryResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return secretService.list(user);
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
    public SecretDetailResponse rotate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID secretId,
            @Valid @RequestBody RotateSecretRequest request
    ) {
        return secretService.rotate(user, secretId, request);
    }
}
