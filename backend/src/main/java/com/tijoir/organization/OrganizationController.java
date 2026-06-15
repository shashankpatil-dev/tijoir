package com.tijoir.organization;

import com.tijoir.auth.dto.AuthResponse;
import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.organization.dto.AcceptInviteRequest;
import com.tijoir.organization.dto.CreateInviteRequest;
import com.tijoir.organization.dto.InviteResponse;
import com.tijoir.organization.dto.MemberResponse;
import com.tijoir.organization.dto.UpdateMemberRoleRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organization")
public class OrganizationController {
    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping("/members")
    public List<MemberResponse> listMembers(@AuthenticationPrincipal AuthenticatedUser user) {
        return organizationService.listMembers(user);
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
    public List<InviteResponse> listInvites(@AuthenticationPrincipal AuthenticatedUser user) {
        return organizationService.listInvites(user);
    }

    @PostMapping("/invites")
    @ResponseStatus(HttpStatus.CREATED)
    public InviteResponse createInvite(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateInviteRequest request
    ) {
        return organizationService.createInvite(user, request);
    }

    @PostMapping("/invites/{inviteId}/revoke")
    public InviteResponse revokeInvite(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID inviteId
    ) {
        return organizationService.revokeInvite(user, inviteId);
    }

    @PostMapping("/invites/accept")
    public AuthResponse acceptInvite(@Valid @RequestBody AcceptInviteRequest request) {
        return organizationService.acceptInvite(request);
    }
}
