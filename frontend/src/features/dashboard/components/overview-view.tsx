import {
  DetailList,
  EmptyState,
  PageSection,
} from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";

export function OverviewView({
  activeSecret,
  isOrganizationManager,
  lastCreatedShareReady,
  memberCount,
  onCreateSecret,
  onCreateShareLink,
  onInviteMember,
  pendingInvites,
  session,
}: {
  activeSecret: SecretSummary | null;
  isOrganizationManager: boolean;
  lastCreatedShareReady: boolean;
  memberCount: number;
  onCreateSecret: () => void;
  onCreateShareLink: () => void;
  onInviteMember: () => void;
  pendingInvites: number;
  session: AuthResponse | null;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <PageSection
        description="This is the current organization session context and operational summary."
        title="Current identity"
      >
        {session ? (
          <DetailList
            items={[
              { label: "User", value: session.user.name },
              { label: "Email", value: session.user.email },
              { label: "Role", value: session.user.role },
              {
                label: "Email verified",
                value: session.user.emailVerified ? "Yes" : "No",
              },
              { label: "Organization", value: session.organization.name },
              { label: "Token expires", value: formatInstant(session.expiresAt) },
            ]}
          />
        ) : (
          <EmptyState
            description="No session is available. Return to login to restore the organization workspace."
            title="No session"
          />
        )}
      </PageSection>

      <div className="space-y-5">
        <PageSection
          description="Focus surfaces the most recent operational context."
          title="Workspace focus"
        >
          <div className="space-y-3">
            <SurfaceNote
              label="Selected secret"
              value={activeSecret ? activeSecret.secretKey : "No secret selected"}
            />
            <SurfaceNote
              label="Last share link"
              value={
                lastCreatedShareReady
                  ? "A new recipient link is ready for testing."
                  : "No share link created in this session."
              }
            />
            <SurfaceNote
              label="Member operations"
              value={
                isOrganizationManager
                  ? `${memberCount} members and ${pendingInvites} pending invites in the workspace.`
                  : "Member management is reserved for organization managers."
              }
            />
          </div>
        </PageSection>

        <PageSection
          description="Fast entry points for the current product workflows."
          title="Quick actions"
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={onCreateSecret} type="button">
              Create secret
            </Button>
            <Button onClick={onCreateShareLink} type="button" variant="secondary">
              Create share link
            </Button>
            {isOrganizationManager ? (
              <Button onClick={onInviteMember} type="button" variant="outline">
                Invite member
              </Button>
            ) : null}
          </div>
        </PageSection>
      </div>
    </div>
  );
}
