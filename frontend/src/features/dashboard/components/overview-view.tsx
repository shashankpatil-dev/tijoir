import {
  DefinitionRows,
  EmptyState,
  PageSection,
  StatCard,
  StatCardSkeleton,
} from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import type { AuthResponse } from "@/features/auth/types/auth.types";
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
  const showLoadingState = loadingWorkspace;

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

      <PageSection title="Workspace summary">
        {showLoadingState ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                className="h-12 animate-pulse rounded-xl bg-(--color-surface-strong)"
                key={index}
              />
            ))}
          </div>
        ) : session ? (
          <DefinitionRows
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
    </div>
  );
}
