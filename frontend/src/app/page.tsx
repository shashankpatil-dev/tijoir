import Link from "next/link";
import {
  KeyRound,
  Share2,
  Building2,
  RotateCcw,
  ShieldCheck,
  ScrollText,
  Timer,
  Lock,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Badge } from "@/components/ui/badge";

const trustStrip = [
  { icon: Lock, label: "AES-256 encrypted" },
  { icon: Timer, label: "One-time & expiring links" },
  { icon: ScrollText, label: "Every reveal audited" },
  { icon: ShieldCheck, label: "Revoke anytime" },
];

const features = [
  {
    icon: KeyRound,
    title: "One vault for every secret",
    description:
      "Passwords, API keys, SSH & SFTP creds, tokens, webhooks — generated, encrypted, and organized in one place.",
  },
  {
    icon: Share2,
    title: "Share on your terms",
    description:
      "Send a secret with a link that expires, opens once, and can be revoked the moment you change your mind.",
  },
  {
    icon: Building2,
    title: "Scoped vendor access",
    description:
      "Give an outside vendor access to exactly the secrets they need — then pull it back when the work is done.",
  },
  {
    icon: RotateCcw,
    title: "Rotate, keep the history",
    description:
      "Roll a credential forward and keep its version trail. No more guessing who still has the old value.",
  },
];

const steps = [
  { title: "Add it to the vault", body: "Store or generate a secret in your organization's encrypted vault." },
  { title: "Share a link", body: "Send it to a teammate or vendor — set it to expire or open just once." },
  { title: "Stay in control", body: "See every reveal in the audit log and revoke access whenever you want." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_40%,#edf4ff_100%)] text-(--color-ink)">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-7">
            <Badge tone="brand">Secure secret sharing for teams</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-(--color-ink-strong) sm:text-5xl lg:text-[3.4rem] lg:leading-[1.04]">
              Share secrets,
              <br />
              not screenshots.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              Tijoir is the secure vault where your team stores credentials and
              hands them off — to teammates or outside vendors — through links
              that expire, open once, and stay under your control.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--color-brand) px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
                href="/signup"
              >
                Get started free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-medium text-(--color-ink) transition hover:border-(--color-brand) hover:bg-(--color-surface)"
                href="/access"
              >
                Open a shared link
              </Link>
            </div>

            <p className="text-sm text-muted">
              No credit card · Set up your workspace in minutes
            </p>
          </div>

          {/* Product preview mock */}
          <ProductPreview />
        </div>

        {/* Trust strip */}
        <div className="mt-14 grid gap-3 rounded-2xl border border-border bg-white/80 p-4 shadow-(--shadow-card) sm:grid-cols-2 lg:grid-cols-4">
          {trustStrip.map((item) => {
            const Icon = item.icon;
            return (
              <div className="flex items-center gap-3 px-2 py-1" key={item.label}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
                  <Icon className="size-4" />
                </span>
                <p className="text-sm font-medium text-(--color-ink-strong)">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-(--color-brand-strong)">
              Everything in one place
            </p>
            <h2 className="text-3xl font-semibold text-(--color-ink-strong) sm:text-4xl">
              Built for the handoff every team gets wrong
            </h2>
            <p className="text-lg leading-8 text-muted">
              Stop pasting credentials into Slack, email, and tickets. Give your
              team one secure way to store and share them.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  className="rounded-2xl border border-border bg-(--color-surface) p-6 shadow-(--shadow-card) transition hover:-translate-y-0.5 hover:shadow-lg"
                  key={item.title}
                >
                  <span className="flex size-11 items-center justify-center rounded-full bg-(--color-brand-soft) text-(--color-brand-strong)">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-(--color-ink-strong)">
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

      {/* Quick-share hook */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-border bg-white p-8 shadow-(--shadow-card) lg:grid-cols-[1fr_0.9fr] lg:p-12">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-(--color-brand) px-3 py-1 text-xs font-semibold text-white">
              <Timer className="size-3.5" />
              No login needed
            </span>
            <h2 className="text-3xl font-semibold text-(--color-ink-strong) sm:text-4xl">
              Need to send one password, right now?
            </h2>
            <p className="text-lg leading-8 text-muted">
              Drop a secret into a one-time link and send it. The recipient opens
              it once, from their own device — then it's gone. No account, no copy
              left sitting in someone's inbox.
            </p>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand-strong) hover:underline"
              href="/signup"
            >
              Create your first link
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li
                className="flex gap-4 rounded-2xl border border-border bg-(--color-surface) p-4"
                key={step.title}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-brand) text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-(--color-ink-strong)">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 rounded-3xl border border-(--color-brand-soft) bg-[linear-gradient(135deg,var(--color-brand-panel),#ffffff)] p-12 text-center shadow-(--shadow-card)">
          <h2 className="max-w-2xl text-3xl font-semibold text-(--color-ink-strong) sm:text-4xl">
            Give your team a safer way to share secrets
          </h2>
          <p className="max-w-xl text-lg leading-8 text-muted">
            Set up your organization in minutes. Encrypted at rest, audited on
            every reveal, revocable whenever you need.
          </p>
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-(--color-brand) px-7 py-4 text-sm font-semibold text-white transition hover:bg-(--color-brand-strong)"
            href="/signup"
          >
            Create your workspace
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-[radial-gradient(60%_60%_at_70%_10%,var(--color-brand-soft),transparent)]" />
      <div className="rounded-3xl border border-border bg-white p-3 shadow-[0_24px_60px_-24px_rgba(13,34,64,0.35)]">
        <div className="rounded-2xl border border-(--color-dashboard-border) bg-(--color-dashboard-bg) p-5">
          {/* window dots */}
          <div className="mb-4 flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-300" />
            <span className="ml-3 text-xs font-medium text-muted">Vault · Acme Inc.</span>
          </div>

          {/* secret rows */}
          <div className="space-y-2.5">
            {[
              { name: "Stripe API key", type: "API_KEY" },
              { name: "SFTP password", type: "PASSWORD" },
              { name: "Webhook signing secret", type: "WEBHOOK" },
            ].map((row) => (
              <div
                className="flex items-center justify-between rounded-xl border border-border bg-white px-3.5 py-3"
                key={row.name}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-(--color-brand-soft) text-(--color-brand-strong)">
                    <KeyRound className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-(--color-ink-strong)">
                      {row.name}
                    </p>
                    <p className="font-mono text-xs text-muted">••••••••••••</p>
                  </div>
                </div>
                <span className="rounded-full bg-(--color-surface) px-2.5 py-1 text-[11px] font-semibold text-muted">
                  {row.type}
                </span>
              </div>
            ))}
          </div>

          {/* share link chip */}
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-(--color-brand-soft) bg-(--color-brand-panel) px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--color-brand) text-white">
                <Share2 className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-mono text-xs text-(--color-ink-strong)">
                  tijoir.app/access/8f3a…9c
                </p>
                <p className="text-[11px] font-medium text-(--color-brand-strong)">
                  One-time · expires in 24h
                </p>
              </div>
            </div>
            <span className="flex size-8 items-center justify-center rounded-lg bg-white text-(--color-brand-strong)">
              <Copy className="size-4" />
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2 px-1 text-xs text-emerald-600">
            <Check className="size-3.5" />
            Copied — ready to send
          </div>
        </div>
      </div>
    </div>
  );
}
