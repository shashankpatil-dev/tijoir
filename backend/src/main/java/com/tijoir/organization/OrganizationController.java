package com.tijoir.organization;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.AuthCookieService;
import com.tijoir.auth.AuthService;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.paging.PageResponse;
import com.tijoir.organization.dto.AcceptInviteRequest;
import com.tijoir.organization.dto.CreateInviteRequest;
import com.tijoir.organization.dto.InviteResponse;
import com.tijoir.organization.dto.MemberResponse;
import com.tijoir.organization.dto.OrganizationPolicyResponse;
import com.tijoir.organization.dto.UpdateMemberRoleRequest;
import com.tijoir.organization.dto.UpdateOrganizationPolicyRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/organization")
public class OrganizationController {
    private final OrganizationService organizationService;
    private final AuthCookieService authCookieService;

    public OrganizationController(
            OrganizationService organizationService,
            AuthCookieService authCookieService
    ) {
        this.organizationService = organizationService;
        this.authCookieService = authCookieService;
    }

    @GetMapping("/members")
    public PageResponse<MemberResponse> listMembers(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UserRole role
    ) {
        return organizationService.listMembers(user, page, size, query, role);
    }

    @PatchMapping("/members/{memberId}/role")
    public MemberResponse updateMemberRole(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest request
    ) {
        return organizationService.updateMemberRole(user, memberId, request);
    }

    @DeleteMapping("/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID memberId
    ) {
        organizationService.removeMember(user, memberId);
    }

    @GetMapping("/invites")
    public PageResponse<InviteResponse> listInvites(
            @AuthenticationPrincipal AuthenticatedUser user,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer page,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Integer size,
            @org.springframework.web.bind.annotation.RequestParam(required = false) String query,
            @org.springframework.web.bind.annotation.RequestParam(required = false) UserRole role,
            @org.springframework.web.bind.annotation.RequestParam(required = false) OrganizationInviteStatus status
    ) {
        return organizationService.listInvites(user, page, size, query, role, status);
    }

    @GetMapping("/policy")
    public OrganizationPolicyResponse getPolicy(@AuthenticationPrincipal AuthenticatedUser user) {
        return organizationService.getPolicy(user);
    }

    @PutMapping("/policy")
    public OrganizationPolicyResponse updatePolicy(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpdateOrganizationPolicyRequest request
    ) {
        return organizationService.updatePolicy(user, request);
    }

    @PostMapping("/invites")
    public ResponseEntity<InviteResponse> createInvite(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateInviteRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(organizationService.createInvite(user, request));
    }

    @PostMapping("/invites/{inviteId}/revoke")
    public InviteResponse revokeInvite(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID inviteId
    ) {
        return organizationService.revokeInvite(user, inviteId);
    }

    @PostMapping("/invites/accept")
    public ResponseEntity<AuthResponse> acceptInvite(@Valid @RequestBody AcceptInviteRequest request) {
        AuthService.IssuedSession issuedSession = organizationService.acceptInvite(request);
        HttpHeaders headers = new HttpHeaders();
        authCookieService.writeRefreshCookie(headers, issuedSession.rawRefreshToken(), issuedSession.authResponse().refreshExpiresAt());
        return ResponseEntity.ok()
                .headers(headers)
                .body(issuedSession.authResponse());
    }
}
