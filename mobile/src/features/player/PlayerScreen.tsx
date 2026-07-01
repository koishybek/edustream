import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  HelpCircle,
  Lock,
  PlayCircle,
  RotateCcw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCourseProgress,
  useRecordProgress,
} from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { LessonVideo } from "../../ui/LessonVideo";
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

  const modules = useMemo(() => progress?.modules ?? [], [progress]);

  // Flat, ordered lesson queue annotated with each lesson's module.
  const flat = useMemo(
    () =>
      modules.flatMap((m) =>
        m.lessons.map((l) => ({ ...l, moduleId: m.id })),
      ),
    [modules],
  );

  const [currentIdx, setCurrentIdx] = useState(0);

  // On (re)load, jump to the first incomplete lesson.
  useEffect(() => {
    if (flat.length === 0) return;
    const firstIncomplete = flat.findIndex((l) => !l.completed);
    setCurrentIdx(firstIncomplete === -1 ? flat.length - 1 : firstIncomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flat.length]);

  const current = flat[currentIdx];
  const currentModule = current
    ? modules.find((m) => m.id === current.moduleId)
    : undefined;
  const moduleLessonsDone =
    currentModule?.lessons.every((l) => l.completed) ?? false;
  const showQuizCta =
    !!currentModule?.quiz && moduleLessonsDone && !currentModule.quiz.passed;

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
    const lesson = flat[idx];
    const mod = modules.find((m) => m.id === lesson.moduleId);
    const isLastOfModule =
      !!mod && mod.lessons[mod.lessons.length - 1]?.lessonId === lesson.lessonId;
    try {
      const res = await record.mutateAsync({
        lessonId: lesson.lessonId,
        completed: true,
      });
      snack(res.progressPercent >= 100 ? t("player.completed") : t("player.markDone"));
      // If this finishes a module that has a pending quiz, stay put so the
      // "take the quiz" CTA surfaces; otherwise advance to the next lesson.
      if (isLastOfModule && mod?.quiz && !mod.quiz.passed) return;
      if (idx < flat.length - 1) setCurrentIdx(idx + 1);
    } catch {
      snack(t("errorGeneric"), "error");
    }
  }

  const goQuiz = (quizId: string) => navigate(`/learn/${courseId}/quiz/${quizId}`);

  return (
    <div className="screen">
      <div className="player" style={{ flex: "none" }}>
        <LessonVideo url={current.videoUrl} title={current.title} />
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

          {showQuizCta && currentModule?.quiz ? (
            <Button
              variant="primary"
              block
              style={{ marginTop: 16 }}
              leftIcon={<HelpCircle className="icon-sm" />}
              onClick={() => goQuiz(currentModule.quiz!.id)}
            >
              {t("quiz.takeModuleTest")}
            </Button>
          ) : (
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
          )}
        </div>

        <hr className="divider" style={{ margin: "8px 0" }} />
        <div className="section-head" style={{ paddingBottom: 6 }}>
          <div className="t-section">{t("player.lessons")}</div>
        </div>
        <div>
          {modules.map((m) => {
            const lessonsDone = m.lessons.every((l) => l.completed);
            return (
              <div key={m.id}>
                {m.lessons.map((l) => {
                  const i = flat.findIndex((f) => f.lessonId === l.lessonId);
                  return (
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
                        <div className="pl-lesson__d">{m.title}</div>
                      </div>
                      {i === currentIdx ? (
                        <PlayCircle className="icon-sm" style={{ color: "var(--text-2)" }} />
                      ) : l.completed ? (
                        <RotateCcw className="icon-sm" style={{ color: "var(--text-2)" }} />
                      ) : (
                        <Lock className="icon-sm" style={{ color: "var(--text-2)" }} />
                      )}
                    </button>
                  );
                })}
                {m.quiz && (
                  <button
                    className={`pl-lesson${m.quiz.passed ? " done" : ""}`}
                    disabled={!lessonsDone}
                    onClick={() => goQuiz(m.quiz!.id)}
                    style={!lessonsDone ? { opacity: 0.5 } : undefined}
                  >
                    <div className="pl-lesson__check">
                      <Check className="icon-sm" />
                    </div>
                    <div className="pl-lesson__main">
                      <div className="pl-lesson__t">{t("quiz.moduleTest")}</div>
                      <div className="pl-lesson__d">
                        {t("quiz.questionsN", { n: m.quiz.questionCount })}
                        {m.quiz.passed ? ` · ${t("quiz.passedShort")}` : ""}
                      </div>
                    </div>
                    {m.quiz.passed ? (
                      <Check className="icon-sm" style={{ color: "var(--accent)" }} />
                    ) : lessonsDone ? (
                      <HelpCircle className="icon-sm" style={{ color: "var(--accent)" }} />
                    ) : (
                      <Lock className="icon-sm" style={{ color: "var(--text-2)" }} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
