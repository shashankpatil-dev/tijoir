package com.tijoir.sharelink;

import com.tijoir.common.exception.ApiException;
import com.tijoir.securitycontrol.ClientIpResolver;
import com.tijoir.securitycontrol.PublicShareLinkSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import com.tijoir.sharelink.dto.ConsumeShareLinkResponse;
import com.tijoir.sharelink.dto.PublicShareLinkMetadataResponse;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
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
    private final PublicShareLinkSecurityService publicShareLinkSecurityService;
    private final ClientIpResolver clientIpResolver;

    public PublicShareLinkController(
            ShareLinkService shareLinkService,
            PublicShareLinkSecurityService publicShareLinkSecurityService,
            ClientIpResolver clientIpResolver
    ) {
        this.shareLinkService = shareLinkService;
        this.publicShareLinkSecurityService = publicShareLinkSecurityService;
        this.clientIpResolver = clientIpResolver;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicShareLinkMetadataResponse> metadata(@PathVariable String token, HttpServletRequest request) {
        String clientIp = clientIpResolver.resolve(request);
        publicShareLinkSecurityService.assertMetadataAllowed(token, clientIp);
        try {
            ResponseEntity<PublicShareLinkMetadataResponse> response = ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(shareLinkService.publicMetadata(token));
            return response;
        } catch (ApiException exception) {
            if (exception.getStatus() == HttpStatus.NOT_FOUND) {
                publicShareLinkSecurityService.recordMissingTokenProbe(clientIp);
            }
            throw exception;
        }
    }

    @PostMapping("/{token}/consume")
    public ResponseEntity<ConsumeShareLinkResponse> consume(@PathVariable String token, HttpServletRequest request) {
        String clientIp = clientIpResolver.resolve(request);
        publicShareLinkSecurityService.assertConsumeAllowed(token, clientIp);
        try {
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(shareLinkService.consume(token));
        } catch (ApiException exception) {
            if (exception.getStatus() == HttpStatus.NOT_FOUND) {
                publicShareLinkSecurityService.recordMissingTokenProbe(clientIp);
            }
            throw exception;
        }
    }
}
