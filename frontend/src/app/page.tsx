import { SiteHeader } from "@/components/site-chrome";

const highlights = [
  {
    title: "Centralize vendor credentials",
    description:
      "Keep operational passwords, API keys, SSH material, and future shared access contracts under one organization-owned control point.",
  },
  {
    title: "Reduce unsafe sharing",
    description:
      "Replace scattered chat messages, spreadsheets, and ad hoc document transfers with a structured vault-first workflow.",
  },
  {
    title: "Preserve auditability",
    description:
      "Build around verification, RBAC, append-only audit events, and controlled secret lifecycle operations from the start.",
  },
];

const useCases = [
  "A company needs to share SFTP or API credentials with an external vendor without losing ownership of access.",
  "An ops team wants an org-level dashboard for who owns credentials, who accessed them, and what can be revoked.",
  "A security-focused MVP needs auth, vault, and production deployment credibility for an SDE1-grade project.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-[var(--color-brand-soft)] bg-[var(--color-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              Secure vendor credential exchange
            </span>

            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[var(--color-ink-strong)] sm:text-5xl">
                Tijoir helps organizations share vendor credentials without giving
                up control.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-[var(--color-muted)]">
                The product is built for teams that need a cleaner way to onboard
                vendors, protect secrets, and move away from insecure credential
                sharing through chats, docs, and manual handoffs.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[linear-gradient(135deg,var(--color-brand-panel),white)] p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
              What the app is about
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--color-muted)]">
              <p>
                Tijoir is an organization-first system for secure credential
                exchange. An organization signs up, verifies its owner account,
                logs in, and then operates from its own dashboard like a normal
                SaaS workspace.
              </p>
              <p>
                From there, the product can manage vault secrets, access control,
                audits, vendor sharing, and lifecycle actions such as reveal,
                rotate, and revoke.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--color-border)] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]"
                key={item.title}
              >
                <h2 className="text-lg font-semibold text-[var(--color-ink-strong)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-surface)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-strong)]">
                Core use cases
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--color-ink-strong)]">
                Designed for teams that need secure external access workflows
              </h2>
            </div>

            <div className="space-y-4">
              {useCases.map((item) => (
                <div
                  className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]"
                  key={item}
                >
                  <p className="text-sm leading-7 text-[var(--color-muted)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
