import {
  DetailList,
  DetailListSkeleton,
  EmptyState,
  PageSection,
  StatCard,
  StatCardSkeleton,
  SurfaceNoteListSkeleton,
} from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import type { AuthResponse } from "@/features/auth/types/auth.types";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { SecretSummary } from "@/features/secrets/types/secrets.types";

export function OverviewView({
  activeSecret,
  activeShareLinks,
  isOrganizationManager,
  lastCreatedShareReady,
  loadingWorkspace,
  memberCount,
  organizationName,
  onCreateSecret,
  onCreateShareLink,
  onInviteMember,
  pendingInvites,
  session,
  secretCount,
  vendorCount,
}: {
  activeSecret: SecretSummary | null;
  activeShareLinks: number;
  isOrganizationManager: boolean;
  lastCreatedShareReady: boolean;
  loadingWorkspace: boolean;
  memberCount: number;
  organizationName: string;
  onCreateSecret: () => void;
  onCreateShareLink: () => void;
  onInviteMember: () => void;
  pendingInvites: number;
  session: AuthResponse | null;
  secretCount: number;
  vendorCount: number;
}) {
  const showLoadingState = loadingWorkspace && !session;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {showLoadingState ? (
          Array.from({ length: 5 }).map((_, index) => <StatCardSkeleton key={index} />)
        ) : (
          <>
            <StatCard
              label="Vault items"
              note="Protected secrets in this workspace"
              value={String(secretCount)}
            />
            <StatCard
              label="Active share links"
              note="Recipient access currently live"
              value={String(activeShareLinks)}
            />
            <StatCard
              label="Vendors"
              note="Tracked external entities"
              value={String(vendorCount)}
            />
            <StatCard
              label="Team members"
              note="Users in this organization"
              value={String(memberCount)}
            />
            <StatCard
              label="Pending invites"
              note="People waiting to join"
              value={String(pendingInvites)}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <PageSection
          description="A clear view of the current organization workspace and its main activity."
          title="Workspace summary"
        >
          {showLoadingState ? (
            <DetailListSkeleton />
          ) : session ? (
            <DetailList
              items={[
                { label: "Organization", value: organizationName },
                { label: "Signed in as", value: session.user.name },
                { label: "Role", value: session.user.role },
                { label: "Email", value: session.user.email },
                { label: "Current session", value: formatInstant(session.expiresAt) },
                { label: "Workspace slug", value: session.organization.slug },
              ]}
            />
          ) : (
            <EmptyState
              description="No session is available. Return to login to restore the workspace."
              title="No session"
            />
          )}
        </PageSection>

        <div className="space-y-5">
          <PageSection
            description="The next things that matter most in the current workspace."
            title="Focus"
          >
            {showLoadingState ? (
              <SurfaceNoteListSkeleton />
            ) : (
              <div className="space-y-3">
                <SurfaceNote
                  label="Selected secret"
                  value={activeSecret ? activeSecret.secretKey : "No secret selected"}
                />
                <SurfaceNote
                  label="Last share link"
                  value={
                    lastCreatedShareReady
                      ? "A new recipient access package is ready."
                      : "No recent recipient package is staged."
                  }
                />
                <SurfaceNote
                  label="Team access"
                  value={
                    isOrganizationManager
                      ? `${memberCount} members and ${pendingInvites} pending invites in the workspace.`
                      : "Team administration is available to organization managers."
                  }
                />
              </div>
            )}
          </PageSection>

          <PageSection
            description="Fast entry points for the main workflows."
            title="Quick actions"
          >
            <div className="flex flex-wrap gap-3">
              <Button disabled={showLoadingState} onClick={onCreateSecret} type="button">
                Create secret
              </Button>
              <Button
                disabled={showLoadingState}
                onClick={onCreateShareLink}
                type="button"
                variant="secondary"
              >
                Create share link
              </Button>
              {isOrganizationManager ? (
                <Button
                  disabled={showLoadingState}
                  onClick={onInviteMember}
                  type="button"
                  variant="outline"
                >
                  Invite member
                </Button>
              ) : null}
            </div>
          </PageSection>
        </div>
      </div>
    </div>
  );
}
