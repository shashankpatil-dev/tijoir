package com.tijoir.sharelink;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.contract.ContractPermission;
import com.tijoir.sharelink.dto.CreateShareLinkRequest;
import com.tijoir.sharelink.dto.ShareLinkResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/share-links")
public class ShareLinkController {
    private final ShareLinkService shareLinkService;

    public ShareLinkController(ShareLinkService shareLinkService) {
        this.shareLinkService = shareLinkService;
    }

    @PostMapping
    public ResponseEntity<ShareLinkResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateShareLinkRequest request
    ) {
        return ResponseEntity.status(201).body(shareLinkService.create(user, request));
    }

    @GetMapping
    public PageResponse<ShareLinkResponse> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) ContractPermission permission,
            @org.springframework.web.bind.annotation.RequestParam(required = false) ShareLinkStatus status,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID vendorId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID contractId,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UUID grantId
    ) {
        return shareLinkService.list(user, page, size, query, permission, status, vendorId, contractId, grantId);
    }

    @PostMapping("/{shareLinkId}/revoke")
    public ShareLinkResponse revoke(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID shareLinkId
    ) {
        return shareLinkService.revoke(user, shareLinkId);
    }
}
