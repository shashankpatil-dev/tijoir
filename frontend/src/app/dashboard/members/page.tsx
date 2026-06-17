"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardMembersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/organization");
  }, [router]);

  return null;
}
