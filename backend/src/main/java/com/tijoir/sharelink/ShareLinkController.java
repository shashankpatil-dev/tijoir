package com.tijoir.sharelink;

import com.tijoir.auth.security.AuthenticatedUser;
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

import java.util.List;
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
    public List<ShareLinkResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return shareLinkService.list(user);
    }

    @PostMapping("/{shareLinkId}/revoke")
    public ShareLinkResponse revoke(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID shareLinkId
    ) {
        return shareLinkService.revoke(user, shareLinkId);
    }
}
