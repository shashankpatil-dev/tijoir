package com.tijoir.organization;

import com.tijoir.auth.security.AuthenticatedUser;
import com.tijoir.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OrganizationAuthorizationService {
    private final UserAccountRepository userAccountRepository;

    public OrganizationAuthorizationService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }

    public UserAccount requireActor(AuthenticatedUser principal) {
        return userAccountRepository.findByIdAndDeactivatedAtIsNull(principal.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    public void requireSecretManager(UserRole role) {
        if (role == UserRole.ORG_OWNER || role == UserRole.ADMIN || role == UserRole.MEMBER) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to manage secrets");
    }

    public void requireShareManager(UserRole role) {
        if (role == UserRole.ORG_OWNER || role == UserRole.ADMIN || role == UserRole.MEMBER) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to manage share links");
    }

    public void requireVendorManager(UserRole role) {
        if (role == UserRole.ORG_OWNER || role == UserRole.ADMIN || role == UserRole.MEMBER) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to manage vendors");
    }

    public void requireOrganizationManager(UserRole role) {
        if (role == UserRole.ORG_OWNER || role == UserRole.ADMIN) {
            return;
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "You do not have permission to manage organization members");
    }

    public void requireInviteRole(UserRole actorRole, UserRole targetRole) {
        requireOrganizationManager(actorRole);
        if (targetRole == UserRole.ORG_OWNER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ORG_OWNER invites are not supported");
        }
        if (actorRole == UserRole.ADMIN && targetRole == UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admins cannot invite other admins");
        }
    }

    public void requireRoleChange(UserAccount actor, UserAccount target, UserRole requestedRole) {
        requireOrganizationManager(actor.getRole());

        if (actor.getId().equals(target.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own role");
        }
        if (target.getRole() == UserRole.ORG_OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ORG_OWNER role changes are not supported");
        }
        if (requestedRole == UserRole.ORG_OWNER) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ORG_OWNER assignments are not supported");
        }
        if (actor.getRole() == UserRole.ADMIN
                && (target.getRole() == UserRole.ADMIN || requestedRole == UserRole.ADMIN)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admins cannot modify admin roles");
        }
    }

    public void requireMemberRemoval(UserAccount actor, UserAccount target) {
        requireOrganizationManager(actor.getRole());

        if (actor.getId().equals(target.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot remove your own account");
        }
        if (target.getRole() == UserRole.ORG_OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ORG_OWNER removal is not supported");
        }
        if (actor.getRole() == UserRole.ADMIN && target.getRole() == UserRole.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Admins cannot remove other admins");
        }
    }
}
