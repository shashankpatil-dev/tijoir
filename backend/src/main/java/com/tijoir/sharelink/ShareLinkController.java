package com.tijoir.sharelink;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.contract.ContractPermission;
import com.tijoir.securitycontrol.IdempotencyService;
import com.tijoir.securitycontrol.IdempotentResponse;
import com.tijoir.sharelink.dto.CreateShareLinkRequest;
import com.tijoir.sharelink.dto.ShareLinkResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/share-links")
public class ShareLinkController {
    private final ShareLinkService shareLinkService;
    private final IdempotencyService idempotencyService;

    public ShareLinkController(ShareLinkService shareLinkService, IdempotencyService idempotencyService) {
        this.shareLinkService = shareLinkService;
        this.idempotencyService = idempotencyService;
    }

    @PostMapping
    public ResponseEntity<ShareLinkResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateShareLinkRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey
    ) {
        IdempotentResponse<ShareLinkResponse> response = idempotencyService.execute(
                user,
                "share-link-create",
                idempotencyKey,
                request,
                ShareLinkResponse.class,
                () -> IdempotentResponse.created(shareLinkService.create(user, request))
        );
        return ResponseEntity.status(response.status()).body(response.body());
    }

    @GetMapping
    public PageResponse<ShareLinkResponse> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) ContractPermission permission,
            @org.springframework.web.bind.annotation.RequestParam(required = false) ShareLinkStatus status
    ) {
        return shareLinkService.list(user, page, size, query, permission, status);
    }

    @PostMapping("/{shareLinkId}/revoke")
    public ShareLinkResponse revoke(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID shareLinkId
    ) {
        return shareLinkService.revoke(user, shareLinkId);
    }
}
