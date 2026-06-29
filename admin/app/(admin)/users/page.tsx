"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  createdAt: string;
}
interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

const ROLE_CLS: Record<string, string> = {
  ADMIN: "bg-brand-subtle text-brand",
  INSTRUCTOR: "bg-info-subtle text-info",
  STUDENT: "bg-surface-alt text-text-secondary",
};

function RoleBadge({ role }: { role: string }) {
  const label = role.charAt(0) + role.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${ROLE_CLS[role] ?? ROLE_CLS.STUDENT}`}
    >
      {label}
    </span>
  );
}

export default function UsersPage() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (target: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<Paginated<AdminUser>>(
        `/admin/users?page=${target}&pageSize=${PAGE_SIZE}`,
      );
      setRows(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
          Users
        </h1>
        <p className="mt-2 text-text-secondary">
          Everyone registered on the platform.
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

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-text-tertiary">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-text-tertiary">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-text-tertiary">
                  No users.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border last:border-0 hover:bg-surface-alt/50"
                >
                  <td className="px-5 py-3 font-semibold text-text-primary">
                    {u.name}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                    {new Date(u.createdAt).toLocaleDateString("en-CA")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
        <div>
          {total} user{total === 1 ? "" : "s"}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(page - 1)}
            disabled={loading || page <= 1}
            className="rounded-md border border-border px-3 py-1.5 font-semibold text-text-secondary transition-colors hover:bg-surface-alt disabled:opacity-40"
          >
            Prev
          </button>
          <span className="tabular-nums">
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loading || page >= totalPages}
            className="rounded-md border border-border px-3 py-1.5 font-semibold text-text-secondary transition-colors hover:bg-surface-alt disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
