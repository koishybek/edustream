"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { CourseFormModal } from "./CourseFormModal";
import {
  type AdminCourseRow,
  type Category,
  type Paginated,
} from "./types";

const PAGE_SIZE = 20;

/** Small status pill mirroring the semantic tokens. */
function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  const published = status === "PUBLISHED";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        published
          ? "bg-success-subtle text-success"
          : "bg-surface-alt text-text-secondary"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

export default function CoursesPage() {
  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  // Modal state: `null` closed, "new" for create, or a row id for editing.
  const [editing, setEditing] = useState<"new" | AdminCourseRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<Paginated<AdminCourseRow>>(
        `/admin/courses?page=${targetPage}&pageSize=${PAGE_SIZE}`,
      );
      setRows(res.data);
      setTotal(res.total);
      setPage(res.page);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not load courses.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
    // Categories are needed by the form; fetch once.
    api<Category[]>("/categories")
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [load]);

  async function onDelete(row: AdminCourseRow) {
    if (
      !window.confirm(
        `Delete "${row.title}"? This removes its modules, lessons and enrollments. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    setError(null);
    try {
      await api(`/admin/courses/${row.id}`, { method: "DELETE" });
      // Reload the current page; step back if we just emptied it.
      const nextTotal = total - 1;
      const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
      await load(Math.min(page, lastPage));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not delete the course.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary">
            Courses
          </h1>
          <p className="mt-2 text-text-secondary">
            Create, edit and publish courses and their lessons.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="shrink-0 rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-pressed"
        >
          New course
        </button>
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
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Rating</th>
              <th className="px-5 py-3 text-right">Lessons</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-text-tertiary"
                >
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-text-tertiary"
                >
                  No courses yet. Create your first one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-surface-alt/50"
                >
                  <td className="px-5 py-3">
                    <div className="font-semibold text-text-primary">
                      {row.title}
                    </div>
                    <div className="text-xs text-text-tertiary">{row.slug}</div>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {row.category?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                    {row.ratingAvg.toFixed(1)}
                    <span className="text-text-tertiary">
                      {" "}
                      ({row.ratingCount})
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-text-secondary">
                    {lessonCount(row)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        className="rounded-md px-3 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-subtle"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        disabled={deletingId === row.id}
                        className="rounded-md px-3 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error-subtle disabled:opacity-50"
                      >
                        {deletingId === row.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
        <div>
          {total} course{total === 1 ? "" : "s"}
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

      {editing !== null && (
        <CourseFormModal
          courseId={editing === "new" ? null : editing.id}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load(editing === "new" ? 1 : page);
          }}
        />
      )}
    </div>
  );
}

/** Lesson count, tolerant of either an explicit field or a Prisma `_count`. */
function lessonCount(row: AdminCourseRow): number {
  if (typeof row.lessonCount === "number") return row.lessonCount;
  if (typeof row._count?.lessons === "number") return row._count.lessons;
  if (Array.isArray(row.modules)) {
    return row.modules.reduce(
      (sum, m) => sum + (m._count?.lessons ?? m.lessons?.length ?? 0),
      0,
    );
  }
  return 0;
}
