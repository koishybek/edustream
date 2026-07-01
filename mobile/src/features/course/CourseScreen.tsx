import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  HelpCircle,
  Lock,
  PlayCircle,
  Share2,
  Star,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCourse,
  useCourseReviews,
  useCreateReview,
} from "../../core/catalog/catalog.api";
import { durationHours } from "../../core/catalog/format";
import type { CourseModule } from "../../core/catalog/types";
import { useAuth } from "../../core/auth/auth.store";
import { useEnroll, useEnrollments } from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Avatar } from "../../ui/Avatar";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { categoryVisual } from "../../ui/Cover";
import { RatingStars } from "../../ui/RatingStars";
import { Spinner } from "../../ui/Spinner";
import { useSnackbar } from "../../ui/Snackbar";

function ModuleRow({
  module,
  index,
  defaultOpen,
}: {
  module: CourseModule;
  index: number;
  defaultOpen?: boolean;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen ?? false);
  const mins = Math.round(
    module.lessons.reduce((s, l) => s + l.durationSeconds, 0) / 60,
  );
  return (
    <div className={`module${open ? " open" : ""}`}>
      <button
        type="button"
        className="module__head"
        style={{ width: "100%", background: "none", border: "none", font: "inherit", textAlign: "left" }}
        onClick={() => setOpen((o) => !o)}
      >
        <div className="n">{index + 1}</div>
        <div className="tt">
          <div className="t-bodysb">{module.title}</div>
          <div className="t-meta">
            {t("course.moduleMeta", { lessons: module.lessons.length, mins })}
          </div>
        </div>
        <ChevronDown className="icon ch" />
      </button>
      <div className="module__body">
        {module.lessons.map((l) => (
          <div className="lesson" key={l.id}>
            {l.isFreePreview ? (
              <PlayCircle className="icon-sm ic" />
            ) : (
              <Lock className="icon-sm ic" />
            )}
            <span>{l.title}</span>
            {l.isFreePreview && (
              <Badge variant="free" className="free">
                {t("course.preview")}
              </Badge>
            )}
          </div>
        ))}
        {module.quiz && (
          <div className="lesson" key={`${module.id}-quiz`}>
            <HelpCircle className="icon-sm ic" style={{ color: "var(--accent)" }} />
            <span>
              {t("course.quizRow", { n: module.quiz.questionCount })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { snack } = useSnackbar();

  const { data: course, isLoading } = useCourse(slug);
  const { data: reviews } = useCourseReviews(course?.id);
  const { data: enrollments } = useEnrollments();
  const enroll = useEnroll();

  const [success, setSuccess] = useState(false);

  // --- "Your review" state (enrolled users only) ---
  const myUserId = useAuth((s) => s.user?.id);
  const createReview = useCreateReview(course?.id ?? "", slug);
  const myReview =
    (reviews?.data ?? []).find((r) => r.user.id === myUserId) ?? null;
  const [editingReview, setEditingReview] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  useEffect(() => {
    if (myReview) {
      setMyRating(myReview.rating);
      setMyComment(myReview.comment ?? "");
    }
  }, [myReview?.id]);

  if (isLoading || !course) {
    return (
      <div className="screen">
        <div className="screen__top">
          <div className="appbar pad">
            <button className="appbar__btn" onClick={() => navigate(-1)} aria-label={t("back")}>
              <ArrowLeft className="icon" />
            </button>
          </div>
        </div>
        <div className="screen__scroll" style={{ display: "grid", placeItems: "center", paddingTop: 60 }}>
          <Spinner />
        </div>
      </div>
    );
  }

  const { gradient, Icon } = categoryVisual(course.category.slug);
  const enrolled = !!enrollments?.some((e) => e.course.id === course.id);
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const hasPreview = course.modules.some((m) => m.lessons.some((l) => l.isFreePreview));

  async function join() {
    if (!course) return;
    try {
      await enroll.mutateAsync(course.id);
      setSuccess(true);
    } catch {
      snack(t("errorGeneric"), "error");
    }
  }

  async function submitReview() {
    if (!course) return;
    try {
      await createReview.mutateAsync({
        rating: myRating,
        comment: myComment.trim() || undefined,
      });
      setEditingReview(false);
      snack(t("review.saved"));
    } catch {
      snack(t("errorGeneric"), "error");
    }
  }

  if (success) {
    return (
      <div className="screen">
        <div className="success">
          <div className="success__check">
            <Check className="icon" />
          </div>
          <div className="t-title">{t("enroll.successTitle")}</div>
          <div className="t-body muted">
            {t("enroll.successBody", { title: course.title })}
          </div>
          <div style={{ height: 8 }} />
          <Button variant="primary" block onClick={() => navigate(`/learn/${course.id}`)}>
            {t("enroll.start")}
          </Button>
          <Button variant="text" onClick={() => navigate("/learning")}>
            {t("checkout.toLearning")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="screen__scroll" style={{ paddingBottom: 96 }}>
        <div style={{ position: "relative" }}>
          <div className={`${gradient} cv-pat course-hero`}>
            {hasPreview && (
              <span className="hero-badge badge badge--free">
                <PlayCircle className="icon-sm" style={{ width: 12, height: 12 }} />
                {t("course.freePreview")}
              </span>
            )}
            <div className="cv-ico">
              <Icon className="icon-lg" />
            </div>
          </div>
          <div
            className="appbar pad"
            style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
          >
            <button
              className="appbar__btn"
              style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)" }}
              onClick={() => navigate(-1)}
              aria-label={t("back")}
            >
              <ArrowLeft className="icon" />
            </button>
            <div style={{ flex: 1 }} />
            <button
              className="appbar__btn"
              style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)" }}
              onClick={() => snack(t("course.saved"))}
              aria-label={t("course.saved")}
            >
              <Bookmark className="icon" />
            </button>
            <button
              className="appbar__btn"
              style={{ background: "rgba(255,255,255,.9)", backdropFilter: "blur(6px)" }}
              onClick={() => snack(t("profile.soon"))}
              aria-label="Share"
            >
              <Share2 className="icon" />
            </button>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 16 }}>
          <Badge variant="new">{course.category.name}</Badge>
          <div className="t-title" style={{ marginTop: 10 }}>
            {course.title}
          </div>
        </div>

        <div className="meta-row">
          <RatingStars
            value={course.ratingAvg}
            score={course.ratingAvg.toFixed(1)}
            count={`(${course.ratingCount})`}
          />
          <div className="mi">
            <Clock className="icon-sm" />
            {t("course.hours", { hours: durationHours(course.durationMinutes) })}
          </div>
          <div className="mi">
            <BarChart3 className="icon-sm" />
            {t(`level.${course.level}`)}
          </div>
        </div>

        <div className="instructor" style={{ marginTop: 14 }}>
          <Avatar name={course.instructor.name} />
          <div style={{ flex: 1 }}>
            <div className="t-bodysb">{course.instructor.name}</div>
            <div className="t-caption" style={{ margin: "2px 0 0" }}>
              {t("course.instructor")}
            </div>
          </div>
        </div>

        <div className="pad" style={{ marginTop: 18 }}>
          <div className="t-body muted">{course.description}</div>
        </div>

        <div className="section-head">
          <div className="t-section">{t("course.curriculum")}</div>
          <span className="t-caption" style={{ margin: 0 }}>
            {t("course.modulesLessons", {
              modules: course.modules.length,
              lessons: totalLessons,
            })}
          </span>
        </div>
        <div className="pad">
          {course.modules.map((m, i) => (
            <ModuleRow key={m.id} module={m} index={i} defaultOpen={i === 0} />
          ))}
        </div>

        <div className="section-head">
          <div className="t-section">{t("course.reviews")}</div>
          {reviews && (
            <span className="t-caption" style={{ margin: 0 }}>
              {reviews.total}
            </span>
          )}
        </div>
        <div className="pad">
          <div className="rating" style={{ marginBottom: 6 }}>
            <RatingStars
              value={course.ratingAvg}
              score={course.ratingAvg.toFixed(1)}
              count={t("course.avgRating")}
            />
          </div>

          {enrolled && (
            <div className="review your-review" style={{ marginBottom: 12 }}>
              <div className="t-bodysb" style={{ marginBottom: 8 }}>
                {t("review.yours")}
              </div>
              {myReview && !editingReview ? (
                <>
                  <RatingStars value={myReview.rating} />
                  {myReview.comment && (
                    <div className="t-body muted" style={{ marginTop: 6 }}>
                      {myReview.comment}
                    </div>
                  )}
                  <Button variant="text" onClick={() => setEditingReview(true)}>
                    {t("review.edit")}
                  </Button>
                </>
              ) : (
                <>
                  <div
                    role="radiogroup"
                    aria-label={t("review.yours")}
                    style={{ display: "flex", gap: 4, marginBottom: 8 }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={n === myRating}
                        aria-label={String(n)}
                        onClick={() => setMyRating(n)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 2,
                          cursor: "pointer",
                          lineHeight: 0,
                        }}
                      >
                        <Star
                          className="icon"
                          style={{
                            fill: n <= myRating ? "var(--accent)" : "none",
                            color: "var(--accent)",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder={t("review.commentPlaceholder")}
                    rows={3}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      padding: 10,
                      borderRadius: 12,
                      border: "1px solid var(--line, rgba(0,0,0,.12))",
                      font: "inherit",
                    }}
                  />
                  <Button
                    variant="primary"
                    block
                    loading={createReview.isPending}
                    onClick={submitReview}
                    style={{ marginTop: 8 }}
                  >
                    {myReview ? t("review.update") : t("review.leave")}
                  </Button>
                </>
              )}
            </div>
          )}

          {(reviews?.data ?? []).slice(0, 5).map((r) => (
            <div className="review" key={r.id}>
              <div className="review__top">
                <Avatar name={r.user.name} />
                <div style={{ flex: 1 }}>
                  <div className="t-bodysb">{r.user.name}</div>
                  <RatingStars value={r.rating} />
                </div>
              </div>
              {r.comment && <div className="t-body muted">{r.comment}</div>}
            </div>
          ))}
          {(reviews?.data.length ?? 0) === 0 && (
            <div className="t-caption">{t("course.noReviews")}</div>
          )}
        </div>
      </div>

      <div className="sticky-cta">
        {enrolled ? (
          <Button variant="primary" block onClick={() => navigate(`/learn/${course.id}`)}>
            {t("course.continue")}
          </Button>
        ) : (
          <>
            <div className="sticky-cta__price">
              <span className="amt">{t("course.free")}</span>
              <span className="lbl">{t("course.fullAccess")}</span>
            </div>
            <Button
              variant="primary"
              style={{ flex: 1 }}
              loading={enroll.isPending}
              onClick={join}
            >
              {t("course.enrollFree")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
