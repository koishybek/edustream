"use client";

import { useState } from "react";

/**
 * Login shell. Phase 0 establishes the look + tokens; Phase 4 wires it to
 * `POST /api/v1/auth/login` (ADMIN role only), stores the token, and redirects
 * to the dashboard.
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNotice("Authentication is wired in Phase 4.");
  }

  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-brand mb-3">
            EduStream Admin
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
            Sign in
          </h1>
          <p className="mt-2 text-text-secondary">
            Manage courses, content and platform stats.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface border border-border rounded-lg shadow-card p-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-semibold text-text-primary">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@edustream.io"
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-text-primary">
              Password
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-md border border-border bg-surface px-4 py-3 text-text-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>

          {notice && (
            <div
              role="alert"
              className="rounded-md bg-warning-subtle px-3 py-2 text-sm font-medium text-warning"
            >
              {notice}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-brand py-3 font-bold text-white transition-colors hover:bg-brand-pressed"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-tertiary">
          ADMIN role required · wired to{" "}
          <code className="text-text-secondary">/api/v1/auth/login</code> in
          Phase 4.
        </p>
      </div>
    </main>
  );
}
