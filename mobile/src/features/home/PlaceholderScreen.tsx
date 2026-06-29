import { env } from "../../core/env";

/**
 * Phase 0 themed placeholder. Proves the PWA shell is wired (tokens, theme,
 * router, react-query) and exercises the type pairing — Golos Text via
 * `font-display` on headings, Manrope (default `font-sans`) on body. The real
 * onboarding + catalog screens replace this from Phase 1 onward.
 */
export default function PlaceholderScreen() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pb-8 pt-12">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
        Phase 0 · Scaffold
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-text-primary">
        EduStream
      </h1>
      <p className="mt-2 text-lg leading-relaxed text-text-secondary">
        ESG &amp; sustainability education — built for Central Asia, ready for
        the world.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-card">
        <span className="inline-block rounded-full bg-success-subtle px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-success">
          PWA online
        </span>
        <h2 className="mt-3 font-display text-base font-semibold text-text-primary">
          Tokens · Theme · Router · Query
        </h2>
        <p className="mt-1 text-sm text-text-secondary">The app talks to:</p>
        <p className="mt-1 break-all text-sm font-semibold text-brand">
          {env.apiBaseUrl}
        </p>
      </section>

      <div className="mt-auto space-y-3 pt-10">
        <button
          type="button"
          className="w-full rounded-md bg-brand py-3.5 font-semibold text-white transition-colors hover:bg-brand-pressed"
        >
          Get started
        </button>
        <button
          type="button"
          className="w-full rounded-md bg-brand-subtle py-3.5 font-semibold text-brand transition-colors hover:brightness-95"
        >
          Explore catalog
        </button>
        <button
          type="button"
          className="w-full py-2 font-semibold text-brand"
        >
          I already have an account
        </button>
      </div>
    </main>
  );
}
