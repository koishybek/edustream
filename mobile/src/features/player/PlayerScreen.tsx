import { useEffect, useState } from "react";
import { ArrowLeft, Check, Lock, PlayCircle, RotateCcw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCourseProgress,
  useRecordProgress,
} from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Progress } from "../../ui/Progress";
import { Spinner } from "../../ui/Spinner";
import { useSnackbar } from "../../ui/Snackbar";

export default function PlayerScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { snack } = useSnackbar();
  const { data: progress, isLoading } = useCourseProgress(courseId);
  const record = useRecordProgress(courseId);

  const lessons = progress?.lessons ?? [];
  const [currentIdx, setCurrentIdx] = useState(0);

  // On load, jump to the first incomplete lesson.
  useEffect(() => {
    if (lessons.length === 0) return;
    const firstIncomplete = lessons.findIndex((l) => !l.completed);
    setCurrentIdx(firstIncomplete === -1 ? lessons.length - 1 : firstIncomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons.length]);

  const current = lessons[currentIdx];

  if (isLoading || !progress || !current) {
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

  async function markDone() {
    const idx = currentIdx;
    try {
      const res = await record.mutateAsync({
        lessonId: lessons[idx].lessonId,
        completed: true,
      });
      snack(res.progressPercent >= 100 ? t("player.completed") : t("player.markDone"));
      if (idx < lessons.length - 1) setCurrentIdx(idx + 1);
    } catch {
      snack(t("errorGeneric"), "error");
    }
  }

  return (
    <div className="screen">
      <div className="player" style={{ flex: "none" }}>
        <video
          src={current.videoUrl}
          controls
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "#0E120F" }}
        />
        <div style={{ position: "absolute", top: "calc(env(safe-area-inset-top) + 8px)", left: 8, zIndex: 5 }}>
          <button className="appbar__btn" style={{ color: "#fff" }} onClick={() => navigate(-1)} aria-label={t("back")}>
            <ArrowLeft className="icon" />
          </button>
        </div>
      </div>

      <div className="screen__scroll">
        <div className="pad" style={{ paddingTop: 16, paddingBottom: 8 }}>
          <div className="t-meta" style={{ color: "var(--accent)", fontWeight: 700, textTransform: "uppercase" }}>
            {current.moduleTitle}
          </div>
          <div className="t-section" style={{ margin: "4px 0 14px" }}>
            {current.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="t-caption" style={{ margin: 0 }}>{t("player.courseProgress")}</span>
            <span className="learn-card__pct">{progress.progressPercent}%</span>
          </div>
          <Progress value={progress.progressPercent} />
          <Button
            variant="primary"
            block
            style={{ marginTop: 16 }}
            loading={record.isPending}
            disabled={current.completed}
            leftIcon={<Check className="icon-sm" />}
            onClick={markDone}
          >
            {current.completed ? t("player.completed") : t("player.markDone")}
          </Button>
        </div>

        <hr className="divider" style={{ margin: "8px 0" }} />
        <div className="section-head" style={{ paddingBottom: 6 }}>
          <div className="t-section">{t("player.lessons")}</div>
        </div>
        <div>
          {lessons.map((l, i) => (
            <button
              key={l.lessonId}
              className={`pl-lesson${i === currentIdx ? " current" : ""}${l.completed ? " done" : ""}`}
              onClick={() => setCurrentIdx(i)}
            >
              <div className="pl-lesson__check">
                <Check className="icon-sm" />
              </div>
              <div className="pl-lesson__main">
                <div className="pl-lesson__t">{l.title}</div>
                <div className="pl-lesson__d">
                  {t("player.lessonN", { n: i + 1 })} · {l.moduleTitle}
                </div>
              </div>
              {i === currentIdx ? (
                <PlayCircle className="icon-sm" style={{ color: "var(--text-2)" }} />
              ) : l.completed ? (
                <RotateCcw className="icon-sm" style={{ color: "var(--text-2)" }} />
              ) : (
                <Lock className="icon-sm" style={{ color: "var(--text-2)" }} />
              )}
            </button>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
