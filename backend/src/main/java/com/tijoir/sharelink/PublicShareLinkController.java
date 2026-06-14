package com.tijoir.sharelink;

import com.tijoir.sharelink.dto.ConsumeShareLinkResponse;
import com.tijoir.sharelink.dto.PublicShareLinkMetadataResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/share-links")
public class PublicShareLinkController {
    private final ShareLinkService shareLinkService;

    public PublicShareLinkController(ShareLinkService shareLinkService) {
        this.shareLinkService = shareLinkService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicShareLinkMetadataResponse> metadata(@PathVariable String token) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(shareLinkService.publicMetadata(token));
    }

    @PostMapping("/{token}/consume")
    public ResponseEntity<ConsumeShareLinkResponse> consume(@PathVariable String token) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(shareLinkService.consume(token));
    }
}
