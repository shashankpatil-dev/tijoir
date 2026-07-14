"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  DashboardWorkspaceSidebarOrganization,
  DashboardWorkspaceSidebarUser,
  DashboardWorkspaceTopbarActions,
  DashboardWorkspaceTopbarTitle,
} from "@/components/dashboard/dashboard-workspace-topbar";
import { Button } from "@/components/ui/button";
import { resendVerificationRequest } from "@/features/auth/api/auth.api";
import { useDashboardWorkspaceContext } from "@/features/dashboard/components/dashboard-workspace-context";
import { Mail, X } from "lucide-react";

export function DashboardWorkspaceApp({ children }: { children: ReactNode }) {
  const workspace = useDashboardWorkspaceContext();

  return (
    <DashboardShell
      activeItemId={workspace.activeView}
      items={workspace.navigationItems}
      onSelect={(item) => workspace.router.push(item.href)}
      sidebarFooter={<DashboardWorkspaceSidebarUser workspace={workspace} />}
      sidebarHeader={<DashboardWorkspaceSidebarOrganization workspace={workspace} />}
      topbarTitle={<DashboardWorkspaceTopbarTitle workspace={workspace} />}
      topbarActions={<DashboardWorkspaceTopbarActions workspace={workspace} />}
    >
      <section className="space-y-5">
        <DashboardEmailVerificationBanner workspace={workspace} />
        {children}
      </section>
    </DashboardShell>
  );
}

function DashboardEmailVerificationBanner({
  workspace,
}: {
  workspace: ReturnType<typeof useDashboardWorkspaceContext>;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
  }, [workspace.session?.user.email, workspace.session?.user.emailVerified]);

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationRequest(workspace.session?.user.email ?? ""),
    onSuccess: () => {
      workspace.showToast({
        title: "Verification sent",
        description: "A fresh verification email has been requested.",
        tone: "success",
      });
    },
    onError: (error) => {
      workspace.handleSessionError(error, "Could not resend verification email");
    },
  });

  if (!workspace.session || workspace.session.user.emailVerified || dismissed) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white px-4 py-4 shadow-(--shadow-card) sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--color-surface) text-(--color-brand)">
          <Mail className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-(--color-ink-strong)">
            Verify your email to keep the workspace fully active
          </p>
          <p className="mt-1 text-sm leading-6 text-muted">
            We still allow access, but verification should be completed for this account.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:shrink-0">
        <Button
          disabled={resendMutation.isPending}
          onClick={() => void resendMutation.mutateAsync()}
          type="button"
          variant="outline"
        >
          {resendMutation.isPending ? "Sending..." : "Resend verification"}
        </Button>
        <Button
          aria-label="Dismiss verification banner"
          onClick={() => setDismissed(true)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
