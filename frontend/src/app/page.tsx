import Link from "next/link";
import { SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";
const capabilityCards = [
  {
    title: "Vault-first secret control",
    description:
      "Store operational passwords, API keys, webhook secrets, SSH material, and typed secret payloads under one organization-owned workspace.",
  },
  {
    title: "Contract-scoped vendor sharing",
    description:
      "Issue public recipient links with explicit contract permissions like view once, until revoked, or notify-only rotation handling.",
  },
  {
    title: "Security lifecycle operations",
    description:
      "Reveal, rotate, revoke, and audit secret usage from the same dashboard instead of relying on chat messages or scattered documents.",
  },
];

const workflowSteps = [
  "Create the organization owner account and verify email access.",
  "Add or generate secrets inside the vault and review current versions.",
  "Issue a public share link for a vendor or external operator.",
  "Track recipient access, revoke contracts, and rotate secrets when needed.",
];

const productSignals = [
  { label: "Current workspace scope", value: "Auth, vault, sharing, vendors, audit" },
  { label: "Deployment model", value: "Managed AWS delivery with serverless runtime" },
  { label: "Primary use case", value: "Secure credential exchange with external vendors" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_38%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-6">
            <Badge tone="brand">Secure vendor credential exchange</Badge>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-(--color-ink-strong) sm:text-5xl lg:text-[3.4rem]">
                Tijoir gives organizations a cleaner way to share secrets without
                giving up control.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-muted">
                Built as an operations-facing SaaS workspace, Tijoir replaces
                unsafe credential handoffs with organization login, vault storage,
                contract-scoped public share links, and explicit lifecycle actions.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-(--color-brand) bg-(--color-brand) px-5 py-3.5 text-sm font-medium text-white transition hover:border-(--color-brand-strong) hover:bg-(--color-brand-strong)"
                href="/signup"
              >
                Create workspace
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand) hover:bg-(--color-surface)"
                href="/login"
              >
                Login
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {productSignals.map((item) => (
                <div
                  className="rounded-2xl border border-border bg-white/88 p-4 shadow-(--shadow-card)"
                  key={item.label}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-(--color-ink-strong)">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-white p-6 shadow-(--shadow-card)">
            <div className="rounded-3xl border border-(--color-dashboard-border) bg-[linear-gradient(135deg,var(--color-brand-panel),#ffffff)] p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
                Product flow
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-(--color-ink-strong)">
                Designed like an operational SaaS workspace
              </h2>
              <div className="mt-5 space-y-3">
                {workflowSteps.map((step, index) => (
                  <div
                    className="flex gap-3 rounded-2xl border border-white/70 bg-white/80 p-4"
                    key={step}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-brand) text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-(--color-ink)">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              What the product does
            </p>
            <h2 className="text-3xl font-semibold text-(--color-ink-strong)">
              Built for the real handoff workflow teams struggle with
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {capabilityCards.map((item) => (
              <article
                className="rounded-3xl border border-border bg-(--color-surface) p-6 shadow-(--shadow-card)"
                key={item.title}
              >
                <h3 className="text-lg font-semibold text-(--color-ink-strong)">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-5 rounded-[28px] border border-border bg-white p-6 shadow-(--shadow-card) lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              Built for this workflow
            </p>
            <h2 className="text-3xl font-semibold text-(--color-ink-strong)">
              This is not a generic password manager pitch
            </h2>
            <p className="text-sm leading-7 text-muted">
              Tijoir is shaped around vendor onboarding, external operators, and
              revocable access contracts. The core experience starts with a clean
              organization dashboard, not a landing-page-only story.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SignalCard title="Auth" value="Owner signup, verification, login, and session continuity" />
            <SignalCard title="Vault" value="Create, reveal, rotate, revoke, and manage typed secret entries" />
            <SignalCard title="Sharing" value="Recipient access packages with controlled reveal behavior" />
          </div>
        </div>
      </section>
    </main>
  );
}

function SignalCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-(--color-surface) p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-(--color-ink-strong)">{value}</p>
    </div>
  );
}
