"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ProtectedRoute } from "@/components/auth/auth-guards";
import { DashboardWorkspaceApp } from "@/components/dashboard/dashboard-workspace-app";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/dashboard") {
      router.replace("/dashboard/overview");
    }
  }, [pathname, router]);

  return (
    <ProtectedRoute>
      {(sessionState) => (
        <>
          <DashboardWorkspaceApp
            initialSession={sessionState.session!}
            removeSession={sessionState.removeSession}
          />
          <div className="hidden">{children}</div>
        </>
      )}
    </ProtectedRoute>
  );
}
