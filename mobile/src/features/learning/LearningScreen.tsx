import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { durationHours } from "../../core/catalog/format";
import { useEnrollments } from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { AppBar } from "../../ui/AppBar";
import { BottomNav } from "../../ui/BottomNav";
import { Button } from "../../ui/Button";
import { CourseCover } from "../../ui/Cover";
import { EmptyState } from "../../ui/EmptyState";
import { Progress } from "../../ui/Progress";
import { Spinner } from "../../ui/Spinner";

export default function LearningScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { data: enrollments, isLoading } = useEnrollments();

  return (
    <div className="screen">
      <div className="screen__top">
        <AppBar title={t("learning.title")} large />
      </div>
      <div className="screen__scroll pad" style={{ paddingTop: 6 }}>
        {isLoading ? (
          <div style={{ display: "grid", placeItems: "center", paddingTop: 60 }}>
            <Spinner />
          </div>
        ) : !enrollments || enrollments.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="icon-lg" />}
            title={t("learning.emptyTitle")}
            text={t("learning.emptyText")}
            action={
              <Button variant="primary" small style={{ marginTop: 12 }} onClick={() => navigate("/")}>
                {t("learning.toCatalog")}
              </Button>
            }
          />
        ) : (
          <>
            <div style={{ padding: "12px 0 4px" }}>
              <div className="t-caption" style={{ margin: 0 }}>
                {t("learning.countLabel", { count: enrollments.length })}
              </div>
            </div>
            {enrollments.map((e) => {
              const started = e.progressPercent > 0;
              const completed = e.status === "COMPLETED";
              return (
                <div
                  className="learn-card"
                  key={e.id}
                  onClick={() => navigate(`/learn/${e.course.id}`)}
                >
                  <div className="learn-card__top">
                    <CourseCover
                      image={e.course.coverImageUrl}
                      slug={e.course.category.slug}
                      className="learn-card__thumb"
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-bodysb" style={{ lineHeight: 1.3 }}>
                        {e.course.title}
                      </div>
                      <div className="t-caption" style={{ marginTop: 3 }}>
                        {e.course.instructor.name} ·{" "}
                        {t("course.hours", { hours: durationHours(e.course.durationMinutes) })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span className="t-meta" style={{ margin: 0 }}>
                        {started ? t("learning.inProgress") : t("learning.notStarted")}
                      </span>
                      <span className="learn-card__pct">{e.progressPercent}%</span>
                    </div>
                    <Progress value={e.progressPercent} />
                  </div>
                  {completed ? (
                    <Button
                      variant="tonal"
                      small
                      block
                      onClick={(ev) => {
                        ev.stopPropagation();
                        navigate(`/learn/${e.course.id}/complete`);
                      }}
                    >
                      {t("learning.completedBadge")}
                    </Button>
                  ) : (
                    <Button variant={started ? "tonal" : "primary"} small block>
                      {started ? t("learning.continue") : t("learning.start")}
                    </Button>
                  )}
                </div>
              );
            })}
            <div style={{ height: 12 }} />
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
