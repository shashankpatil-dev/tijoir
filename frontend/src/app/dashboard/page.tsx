"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  apiBaseUrl,
  apiRequest,
  clearSession,
  readSession,
  saveSession,
  type AuthResponse,
} from "@/lib/auth-client";
import { SiteHeader, StatusPanel } from "@/components/site-chrome";

const navigation = ["Overview", "Vault", "Share links", "Audit", "Settings"];

const summaryCards = [
  { title: "Vault objects", value: "12", note: "seeded MVP scope" },
  { title: "Pending shares", value: "03", note: "awaiting vendor action" },
  { title: "Protected uptime", value: "99.9%", note: "front door and API active" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [message, setMessage] = useState("Loading workspace");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = readSession();
    if (!stored) {
      setMessage("No stored session. Login required.");
      return;
    }

    setSession(stored);
    setMessage("Session restored from local storage.");
  }, []);

  const workspaceTitle = useMemo(() => {
    if (!session) {
      return "Sign in to access the workspace";
    }

    return `${session.organization.name} security workspace`;
  }, [session]);

  async function refreshProfile() {
    if (!session?.accessToken) {
      setMessage("Login first");
      return;
    }

    setBusy(true);
    setMessage("Refreshing workspace");

    try {
      const result = await apiRequest<AuthResponse>("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      saveSession(result);
      setSession(result);
      setMessage("Workspace refreshed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearSession();
    setSession(null);
    setMessage("Signed out");
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[var(--color-dashboard-bg)] text-[var(--color-ink)]">
      <SiteHeader
        rightContent={
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
              onClick={logout}
              type="button"
            >
              Logout
            </button>
          </div>
        }
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-3xl border border-[var(--color-dashboard-border)] bg-[var(--color-sidebar)] p-5 text-white shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sm font-semibold">
              Tj
            </div>
            <div>
              <p className="text-sm font-medium">Tijoir Console</p>
              <p className="text-xs text-blue-100/80">Operator workspace</p>
            </div>
          </div>

          <nav className="mt-5 space-y-2 text-sm">
            {navigation.map((item, index) => (
              <div
                className={`rounded-2xl px-4 py-3 ${
                  index === 0 ? "bg-white/12 font-medium text-white" : "text-blue-100/78"
                }`}
                key={item}
              >
                {item}
              </div>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-white/8 p-4 text-sm text-blue-100/85">
            <p className="font-medium text-white">API endpoint</p>
            <p className="mt-2 break-all">{apiBaseUrl}</p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
                  Dashboard
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[var(--color-ink-strong)]">
                  {workspaceTitle}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                  This shell now behaves like a real SaaS entry point: structured navigation,
                  persisted session, workspace refresh, and a cleaner operator-facing layout.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
                  onClick={refreshProfile}
                  type="button"
                >
                  {busy ? "Refreshing..." : "Refresh /me"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {summaryCards.map((card) => (
              <div
                className="rounded-2xl border border-[var(--color-dashboard-border)] bg-white p-5 shadow-[var(--shadow-card)]"
                key={card.title}
              >
                <p className="text-sm font-medium text-[var(--color-muted)]">
                  {card.title}
                </p>
                <p className="mt-3 text-3xl font-semibold text-[var(--color-ink-strong)]">
                  {card.value}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{card.note}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-[var(--color-dashboard-border)] bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-semibold text-[var(--color-ink-strong)]">
                Current workspace identity
              </h2>
              {session ? (
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <DashboardRow label="User" value={session.user.name} />
                  <DashboardRow label="Role" value={session.user.role} />
                  <DashboardRow label="Email" value={session.user.email} />
                  <DashboardRow label="Verified" value={String(session.user.emailVerified)} />
                  <DashboardRow label="Organization" value={session.organization.name} />
                  <DashboardRow label="Expires" value={new Date(session.expiresAt).toLocaleString()} />
                </dl>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm leading-7 text-[var(--color-muted)]">
                  No stored session found. Go to{" "}
                  <Link className="font-medium text-[var(--color-brand-strong)]" href="/login">
                    login
                  </Link>{" "}
                  to enter the workspace.
                </div>
              )}
            </div>

            <div className="space-y-5">
              <StatusPanel
                body={message}
                title="System response"
              />
              <StatusPanel
                body="Next frontend step is to replace these placeholder panels with real vault list, secret creation, reveal, rotate, and revoke actions."
                title="Implementation note"
              />
              <StatusPanel
                body="The current structure is ready for route-by-route expansion without collapsing back into a single awkward screen."
                title="Why this is better"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function DashboardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <dt className="text-sm font-medium text-[var(--color-muted)]">{label}</dt>
      <dd className="mt-2 break-words text-sm font-semibold text-[var(--color-ink-strong)]">
        {value}
      </dd>
    </div>
  );
}
