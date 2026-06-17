"use client";

import { PageSection } from "@/components/dashboard/dashboard-shell";
import { SurfaceNote } from "@/features/dashboard/components/surface-note";

export function OrganizationAccessModelSection() {
  return (
    <PageSection
      description="Current role boundaries in this workspace."
      title="Access model"
    >
      <div className="space-y-3">
        <SurfaceNote
          label="ORG_OWNER"
          value="Organization-level control, including member and admin management."
        />
        <SurfaceNote
          label="ADMIN"
          value="Can manage members except owners and other admins, and can operate vault and share workflows."
        />
        <SurfaceNote
          label="MEMBER / VIEWER / AUDITOR"
          value="Operational or read-focused roles without organization-user administration."
        />
      </div>
    </PageSection>
  );
}
