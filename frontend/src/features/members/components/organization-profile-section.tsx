"use client";

import { EmptyState, PageSection } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";
import { formatInstant } from "@/features/dashboard/lib/dashboard-format";
import type { AuthResponse } from "@/features/auth/types/auth.types";

export function OrganizationProfileSection({
  onCreateInvite,
  onOpenSettings,
  session,
}: {
  onCreateInvite: () => void;
  onOpenSettings: () => void;
  session: AuthResponse | null;
}) {
  return (
    <PageSection
      description="Profile, workspace ownership, and the current signed-in access context."
      title="Organization profile"
    >
      {session ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SurfaceNote label="Organization" value={session.organization.name} />
          <SurfaceNote label="Workspace slug" value={session.organization.slug} />
          <SurfaceNote label="Organization email" value={session.organization.email} />
          <SurfaceNote
            label="Signed in as"
            value={`${session.user.name} · ${session.user.role}`}
          />
          <SurfaceNote label="User email" value={session.user.email} />
          <SurfaceNote label="Session expires" value={formatInstant(session.expiresAt)} />
          <div className="flex flex-wrap gap-3 lg:col-span-2">
            <Button onClick={onCreateInvite} type="button">
              Invite member
            </Button>
            <Button onClick={onOpenSettings} type="button" variant="secondary">
              Open policy settings
            </Button>
          </div>
        </div>
      ) : (
        <EmptyState
          description="The current organization profile is not available."
          title="No organization context"
        />
      )}
    </PageSection>
  );
}
