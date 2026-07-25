import { GraduationCap } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import {
  useCourseProgress,
  useEnrollments,
} from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Spinner } from "../../ui/Spinner";

/** Capstone "course completed" screen, reachable only at 100% progress. */
export default function CompletionScreen() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const name = useAuth((s) => s.user?.name ?? "");
  const { data: progress, isLoading } = useCourseProgress(courseId);
  const { data: enrollments } = useEnrollments();

  if (isLoading) {
    return (
      <div className="screen">
        <div style={{ display: "grid", placeItems: "center", paddingTop: 80 }}>
          <Spinner />
        </div>
      </div>
    );
  }

  // Can't view a certificate you haven't earned.
  if (!progress || progress.status !== "COMPLETED") {
    return <Navigate to={`/learn/${courseId}`} replace />;
  }

  const courseTitle =
    enrollments?.find((e) => e.course.id === courseId)?.course.title ?? "";
  const date = progress.completedAt
    ? new Date(progress.completedAt).toLocaleDateString(
        locale === "kz" ? "kk" : locale,
        { year: "numeric", month: "long", day: "numeric" },
      )
    : "";

  return (
    <div className="screen">
      <div
        className="screen__scroll"
        style={{ display: "grid", placeItems: "center", padding: 24, minHeight: "100%" }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            textAlign: "center",
            background: "var(--surface, #fff)",
            border: "1px solid var(--line, rgba(0,0,0,.08))",
            borderRadius: 22,
            padding: "36px 24px",
            boxShadow: "0 16px 48px rgba(0,0,0,.10)",
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              margin: "0 auto",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              background:
                "linear-gradient(135deg, var(--brand, #16a34a), var(--accent, #0ea5e9))",
            }}
          >
            <GraduationCap className="icon-lg" />
          </div>

          <div className="t-title" style={{ marginTop: 16 }}>
            {t("completion.title")}
          </div>
          <div className="t-body muted" style={{ marginTop: 6 }}>
            {t("completion.congrats")}
          </div>

          <div className="t-section" style={{ marginTop: 20 }}>
            {name}
          </div>
          {courseTitle && (
            <div className="t-bodysb" style={{ marginTop: 4 }}>
              {courseTitle}
            </div>
          )}
          {date && (
            <div className="t-caption" style={{ marginTop: 10 }}>
              {t("completion.completedOn")}: {date}
            </div>
          )}

          <div style={{ height: 22 }} />
          <Button variant="primary" block onClick={() => navigate("/learning")}>
            {t("completion.back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
