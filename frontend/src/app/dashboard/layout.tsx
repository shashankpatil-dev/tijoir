"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/auth-guards";
import { DashboardWorkspaceApp } from "@/components/dashboard/dashboard-workspace-app";
import { DashboardWorkspaceProvider } from "@/features/dashboard/components/dashboard-workspace-context";
import { useToast } from "@/components/ui/toast-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (pathname === "/dashboard") {
      router.replace("/dashboard/overview");
    }
  }, [pathname, router]);

  return (
    <ProtectedRoute>
      {(sessionState) => (
        <DashboardWorkspaceProvider
            initialSession={sessionState.session!}
            pathname={pathname}
            removeSession={sessionState.removeSession}
            router={router}
            showToast={showToast}
          >
            <DashboardWorkspaceApp>{children}</DashboardWorkspaceApp>
          </DashboardWorkspaceProvider>
      )}
    </ProtectedRoute>
  );
}
