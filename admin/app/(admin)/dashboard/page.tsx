"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface AdminStats {
  users: number;
  courses: number;
  enrollments: number;
  revenueCents: number;
}

/** KZT amounts are integer cents; render whole tenge with the ₸ symbol. */
function formatTenge(cents: number): string {
  const tenge = Math.round(cents / 100);
  return `${tenge.toLocaleString("en-US")} ₸`;
}

const CARDS: { key: keyof AdminStats; label: string; money?: boolean }[] = [
  { key: "users", label: "Users" },
  { key: "courses", label: "Courses" },
  { key: "enrollments", label: "Enrollments" },
  { key: "revenueCents", label: "Revenue", money: true },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<AdminStats>("/admin/stats")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load dashboard stats.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
          Dashboard
        </h1>
        <p className="mt-2 text-text-secondary">
          Platform stats at a glance.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md bg-error-subtle px-4 py-3 text-sm font-medium text-error"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-lg border border-border bg-surface p-6 shadow-card"
          >
            <div className="text-sm font-semibold text-text-secondary">
              {card.label}
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-text-primary">
              {stats === null ? (
                <span className="inline-block h-8 w-20 animate-pulse rounded bg-surface-alt" />
              ) : card.money ? (
                formatTenge(stats[card.key])
              ) : (
                stats[card.key].toLocaleString("en-US")
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
