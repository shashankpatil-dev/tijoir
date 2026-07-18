package com.tijoir.sharelink;

import com.tijoir.common.exception.ApiException;
import com.tijoir.securitycontrol.ClientIpResolver;
import com.tijoir.securitycontrol.PublicShareLinkSecurityService;
import jakarta.servlet.http.HttpServletRequest;
import com.tijoir.sharelink.dto.ConsumeShareLinkResponse;
import com.tijoir.sharelink.dto.CreatePublicSecretShareRequest;
import com.tijoir.sharelink.dto.CreatePublicSecretShareResponse;
import com.tijoir.sharelink.dto.PublicSecretShareManagementResponse;
import com.tijoir.sharelink.dto.PublicShareLinkMetadataResponse;
import com.tijoir.sharelink.dto.RevokePublicSecretShareResponse;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/share-links")
public class PublicShareLinkController {
    private final ShareLinkService shareLinkService;
    private final PublicSecretDropService publicSecretDropService;
    private final PublicShareLinkSecurityService publicShareLinkSecurityService;
    private final ClientIpResolver clientIpResolver;

    public PublicShareLinkController(
            ShareLinkService shareLinkService,
            PublicSecretDropService publicSecretDropService,
            PublicShareLinkSecurityService publicShareLinkSecurityService,
            ClientIpResolver clientIpResolver
    ) {
        this.shareLinkService = shareLinkService;
        this.publicSecretDropService = publicSecretDropService;
        this.publicShareLinkSecurityService = publicShareLinkSecurityService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/quick")
    public ResponseEntity<CreatePublicSecretShareResponse> createQuickShare(
            @Valid @RequestBody CreatePublicSecretShareRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String clientIp = clientIpResolver.resolve(httpServletRequest);
        publicShareLinkSecurityService.assertCreateAllowed(clientIp);
        return ResponseEntity.status(HttpStatus.CREATED)
                .cacheControl(CacheControl.noStore())
                .body(publicSecretDropService.create(request));
    }

    @PostMapping("/manage/{manageToken}/revoke")
    public ResponseEntity<RevokePublicSecretShareResponse> revokeQuickShare(
            @PathVariable String manageToken,
            HttpServletRequest request
    ) {
        String clientIp = clientIpResolver.resolve(request);
        publicShareLinkSecurityService.assertManageAllowed(manageToken, clientIp);
        try {
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(publicSecretDropService.revoke(manageToken));
        } catch (ApiException exception) {
            if (exception.getStatus() == HttpStatus.NOT_FOUND) {
                publicShareLinkSecurityService.recordMissingTokenProbe(clientIp);
            }
            throw exception;
        }
    }

    @GetMapping("/manage/{manageToken}")
    public ResponseEntity<PublicSecretShareManagementResponse> quickShareManagement(
            @PathVariable String manageToken,
            HttpServletRequest request
    ) {
        String clientIp = clientIpResolver.resolve(request);
        publicShareLinkSecurityService.assertManageAllowed(manageToken, clientIp);
        try {
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(publicSecretDropService.management(manageToken));
        } catch (ApiException exception) {
            if (exception.getStatus() == HttpStatus.NOT_FOUND) {
                publicShareLinkSecurityService.recordMissingTokenProbe(clientIp);
            }
            throw exception;
        }
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicShareLinkMetadataResponse> metadata(@PathVariable String token, HttpServletRequest request) {
        String clientIp = clientIpResolver.resolve(request);
        publicShareLinkSecurityService.assertMetadataAllowed(token, clientIp);
        try {
            ResponseEntity<PublicShareLinkMetadataResponse> response = ResponseEntity.ok()
                    .cacheControl(CacheControl.noStore())
                    .body(resolveMetadata(token));
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
                    .body(resolveConsume(token));
        } catch (ApiException exception) {
            if (exception.getStatus() == HttpStatus.NOT_FOUND) {
                publicShareLinkSecurityService.recordMissingTokenProbe(clientIp);
            }
            throw exception;
        }
    }

    private PublicShareLinkMetadataResponse resolveMetadata(String token) {
        try {
            return shareLinkService.publicMetadata(token);
        } catch (ApiException exception) {
            if (exception.getStatus() != HttpStatus.NOT_FOUND) {
                throw exception;
            }
        }
        return publicSecretDropService.metadata(token);
    }

    private ConsumeShareLinkResponse resolveConsume(String token) {
        try {
            return shareLinkService.consume(token);
        } catch (ApiException exception) {
            if (exception.getStatus() != HttpStatus.NOT_FOUND) {
                throw exception;
            }
        }
        return publicSecretDropService.consume(token);
    }
}
