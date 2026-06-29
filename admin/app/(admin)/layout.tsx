"use client";

import { AdminShell } from "@/components/AdminShell";
import { useRequireAuth } from "@/lib/auth";

/**
 * Layout for the authenticated admin area. Guards every nested route (redirects
 * to /login when no token) and wraps content in the shared sidebar shell. Using
 * a route group `(admin)` keeps these pages at clean URLs (/dashboard, /courses)
 * while sharing one guarded layout.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, user } = useRequireAuth();

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm font-medium text-text-tertiary">Loading…</div>
      </div>
    );
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
