"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import {
  LEVELS,
  STATUSES,
  slugify,
  type AdminCourseDetail,
  type Category,
  type CourseStatus,
  type Level,
  type ModuleDraft,
} from "./types";

interface Instructor {
  id: string;
  name: string;
  role: string;
}

const SAMPLE_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const inputCls =
  "mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand";
const labelCls = "block text-xs font-bold uppercase tracking-wide text-text-tertiary";

export function CourseFormModal({
  courseId,
  categories,
  onClose,
  onSaved,
}: {
  courseId: string | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = courseId !== null;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [priceTenge, setPriceTenge] = useState(0);
  const [status, setStatus] = useState<CourseStatus>("DRAFT");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [modules, setModules] = useState<ModuleDraft[]>([]);

  useEffect(() => {
    api<{ data: Instructor[] }>("/admin/users?pageSize=50")
      .then((r) => setInstructors(r.data.filter((u) => u.role === "INSTRUCTOR")))
      .catch(() => setInstructors([]));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);
    api<AdminCourseDetail>(`/admin/courses/${courseId}`)
      .then((c) => {
        setTitle(c.title);
        setSlug(c.slug);
        setSlugTouched(true);
        setDescription(c.description);
        setCategoryId(c.categoryId);
        setLevel(c.level);
        setDurationMinutes(c.durationMinutes);
        setPriceTenge(Math.round(c.priceCents / 100));
        setStatus(c.status);
        setCoverImageUrl(c.coverImageUrl ?? "");
        setModules(
          (c.modules ?? []).map((m) => ({
            id: m.id,
            title: m.title,
            lessons: (m.lessons ?? []).map((l) => ({
              id: l.id,
              title: l.title,
              durationSeconds: l.durationSeconds,
              videoUrl: l.videoUrl ?? "",
              isFreePreview: l.isFreePreview,
            })),
          })),
        );
      })
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Could not load course."),
      )
      .finally(() => setLoading(false));
  }, [courseId]);

  const effectiveSlug = () => (slugTouched ? slug : slugify(title));

  function updateModule(i: number, patch: Partial<ModuleDraft>) {
    setModules((m) => m.map((mod, j) => (j === i ? { ...mod, ...patch } : mod)));
  }
  function addLesson(mi: number) {
    updateModule(mi, {
      lessons: [
        ...modules[mi].lessons,
        { title: "", durationSeconds: 600, videoUrl: "", isFreePreview: false },
      ],
    });
  }

  async function save() {
    setError(null);
    if (!title.trim() || !categoryId || (!isEdit && !instructorId)) {
      setError("Title, category and instructor are required.");
      return;
    }
    setSaving(true);
    try {
      const priceCents = Math.round(Number(priceTenge) * 100);
      if (isEdit) {
        await api(`/admin/courses/${courseId}`, {
          method: "PATCH",
          body: {
            title,
            description,
            categoryId,
            level,
            durationMinutes: Number(durationMinutes),
            priceCents,
            coverImageUrl: coverImageUrl || undefined,
            status,
          },
        });
      } else {
        await api(`/admin/courses`, {
          method: "POST",
          body: {
            title,
            slug: effectiveSlug(),
            description,
            categoryId,
            instructorId,
            level,
            durationMinutes: Number(durationMinutes),
            priceCents,
            coverImageUrl: coverImageUrl || undefined,
            status,
            modules: modules
              .filter((m) => m.title.trim())
              .map((m) => ({
                title: m.title,
                lessons: m.lessons
                  .filter((l) => l.title.trim())
                  .map((l) => ({
                    title: l.title,
                    videoUrl: l.videoUrl || SAMPLE_VIDEO,
                    durationSeconds: Number(l.durationSeconds) || 0,
                    isFreePreview: l.isFreePreview,
                  })),
              })),
          },
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the course.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-surface p-6 shadow-raised sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-2xl font-bold text-text-primary">
          {isEdit ? "Edit course" : "New course"}
        </h2>

        {loading ? (
          <p className="py-12 text-center text-text-tertiary">Loading…</p>
        ) : (
          <>
            {error && (
              <div className="mt-4 rounded-md bg-error-subtle px-4 py-3 text-sm font-medium text-error">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={labelCls}>Title</span>
                <input
                  className={inputCls}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Corporate Sustainability Strategy"
                />
              </label>

              {!isEdit && (
                <label className="block">
                  <span className={labelCls}>Slug</span>
                  <input
                    className={inputCls}
                    value={slugTouched ? slug : slugify(title)}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                    }}
                    placeholder="corporate-sustainability-strategy"
                  />
                </label>
              )}

              <label className="block">
                <span className={labelCls}>Description</span>
                <textarea
                  className={inputCls}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className={labelCls}>Category</span>
                  <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                {!isEdit && (
                  <label className="block">
                    <span className={labelCls}>Instructor</span>
                    <select className={inputCls} value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
                      <option value="">Select…</option>
                      {instructors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className={labelCls}>Level</span>
                  <select className={inputCls} value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelCls}>Status</span>
                  <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as CourseStatus)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className={labelCls}>Duration (min)</span>
                  <input type="number" className={inputCls} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
                </label>

                <label className="block">
                  <span className={labelCls}>Price (₸)</span>
                  <input type="number" className={inputCls} value={priceTenge} onChange={(e) => setPriceTenge(Number(e.target.value))} />
                </label>
              </div>

              {!isEdit && (
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Curriculum</span>
                    <button
                      type="button"
                      onClick={() => setModules((m) => [...m, { title: "", lessons: [] }])}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      + Module
                    </button>
                  </div>
                  {modules.length === 0 && (
                    <p className="mt-2 text-xs text-text-tertiary">
                      Optional — add modules and lessons, or save and add them later.
                    </p>
                  )}
                  <div className="mt-3 space-y-3">
                    {modules.map((mod, mi) => (
                      <div key={mi} className="rounded-md bg-surface-alt p-3">
                        <div className="flex gap-2">
                          <input
                            className={inputCls + " mt-0 flex-1"}
                            placeholder={`Module ${mi + 1} title`}
                            value={mod.title}
                            onChange={(e) => updateModule(mi, { title: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={() => setModules((m) => m.filter((_, j) => j !== mi))}
                            className="rounded-md px-2 text-sm font-semibold text-error hover:bg-error-subtle"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="mt-2 space-y-2 pl-3">
                          {mod.lessons.map((les, li) => (
                            <div key={li} className="flex items-center gap-2">
                              <input
                                className={inputCls + " mt-0 flex-1"}
                                placeholder={`Lesson ${li + 1}`}
                                value={les.title}
                                onChange={(e) =>
                                  updateModule(mi, {
                                    lessons: mod.lessons.map((l, j) =>
                                      j === li ? { ...l, title: e.target.value } : l,
                                    ),
                                  })
                                }
                              />
                              <label className="flex items-center gap-1 text-xs text-text-secondary">
                                <input
                                  type="checkbox"
                                  checked={les.isFreePreview}
                                  onChange={(e) =>
                                    updateModule(mi, {
                                      lessons: mod.lessons.map((l, j) =>
                                        j === li ? { ...l, isFreePreview: e.target.checked } : l,
                                      ),
                                    })
                                  }
                                />
                                free
                              </label>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addLesson(mi)}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            + Lesson
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-alt"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-pressed disabled:opacity-50"
              >
                {saving ? "Saving…" : isEdit ? "Save changes" : "Create course"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
