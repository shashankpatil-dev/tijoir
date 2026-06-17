package com.tijoir.sharelink;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.contract.ContractPermission;
import com.tijoir.sharelink.dto.CreateShareLinkRequest;
import com.tijoir.sharelink.dto.ShareLinkResponse;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/share-links")
public class ShareLinkController {
    private final ShareLinkService shareLinkService;

    public ShareLinkController(ShareLinkService shareLinkService) {
        this.shareLinkService = shareLinkService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShareLinkResponse create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateShareLinkRequest request
    ) {
        return shareLinkService.create(user, request);
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
