export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">
          Tijoir
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
          Secure vendor credential exchange for organization integrations.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Backend-first MVP for one-time secret links, organization contracts,
          RBAC, append-only audit logs, vendor offboarding, and rotation.
        </p>
      </section>
    </main>
  );
}

