import Link from "next/link";
import {
  KeyRound,
  Share2,
  RotateCcw,
  ShieldCheck,
  ScrollText,
  Timer,
  Link2,
  Building2,
  Lock,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";

const capabilities = [
  {
    icon: KeyRound,
    title: "One vault for every secret",
    description:
      "Passwords, API keys, SSH and SFTP credentials, tokens, and webhook secrets — generated, stored, and encrypted in your organization's vault.",
  },
  {
    icon: Share2,
    title: "Share with control",
    description:
      "Send a secret to a teammate or a vendor with a link that expires, can be revoked, and — if you choose — opens exactly once.",
  },
  {
    icon: Building2,
    title: "Vendor access, revocable",
    description:
      "Grant an external vendor scoped access to specific secrets, then pull it back the moment the engagement ends.",
  },
  {
    icon: RotateCcw,
    title: "Rotate without the scramble",
    description:
      "Rotate a secret and keep its version history. No more chasing who has the old value in which thread.",
  },
];

const trustSignals = [
  { icon: Lock, label: "Encrypted at rest", detail: "AES-256-GCM" },
  { icon: Timer, label: "One-time & expiring links", detail: "read once, then gone" },
  { icon: ScrollText, label: "Append-only audit", detail: "every reveal recorded" },
  { icon: ShieldCheck, label: "Role-based access", detail: "owner to viewer" },
];

const steps = [
  "Create your organization and add secrets to the vault.",
  "Share a secret internally or issue a scoped vendor link.",
  "Recipient opens it once; you keep full audit and revoke control.",
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_38%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-6">
            <Badge tone="brand">Secure secret sharing for teams</Badge>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-(--color-ink-strong) sm:text-5xl lg:text-[3.3rem] lg:leading-[1.05]">
              Stop pasting passwords into chat.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              Tijoir is where your team stores secrets and shares them — inside the
              org or with vendors — through links that expire, open once, and can
              be revoked. Encrypted, audited, under your control.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
                href="/signup"
              >
                Get started free
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand) hover:bg-(--color-surface)"
                href="/access"
              >
                <Link2 className="size-4" />
                Open a shared link
              </Link>
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {trustSignals.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-border bg-white/85 p-3.5 shadow-(--shadow-card)"
                    key={signal.label}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--color-ink-strong)">
                        {signal.label}
                      </p>
                      <p className="text-xs text-muted">{signal.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick-share highlight card */}
          <div className="rounded-2xl border border-border bg-white p-6 shadow-(--shadow-card)">
            <div className="rounded-2xl border border-(--color-dashboard-border) bg-[linear-gradient(135deg,var(--color-brand-panel),#ffffff)] p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-(--color-brand) px-3 py-1 text-xs font-semibold text-white">
                <Timer className="size-3.5" />
                No login needed
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-(--color-ink-strong)">
                Need to send one password, right now?
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">
                Drop a secret into a one-time link and send it. The recipient opens
                it once, from their device, and then it's gone — no account, no
                trail in someone's inbox.
              </p>
              <div className="mt-5 space-y-3">
                {steps.map((step, index) => (
                  <div
                    className="flex gap-3 rounded-xl border border-white/70 bg-white/80 p-3.5"
                    key={step}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-brand) text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-(--color-ink)">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-y border-border bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              Everything in one place
            </p>
            <h2 className="text-3xl font-semibold text-(--color-ink-strong)">
              Built for the handoff every team gets wrong
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  className="rounded-2xl border border-border bg-(--color-surface) p-6 shadow-(--shadow-card)"
                  key={item.title}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-(--color-ink-strong)">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-white p-10 text-center shadow-(--shadow-card)">
          <h2 className="max-w-2xl text-3xl font-semibold text-(--color-ink-strong)">
            Give your team a safer way to share secrets.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted">
            Set up your organization in minutes. Your secrets stay encrypted, every
            reveal is audited, and access is yours to revoke at any time.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-xl bg-(--color-brand) px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
              href="/signup"
            >
              Create your workspace
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-3.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand) hover:bg-(--color-surface)"
              href="/login"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
