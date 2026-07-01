import { useState } from "react";
import { ArrowLeft, Check, RotateCcw, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useQuiz,
  useSubmitQuiz,
  type QuizResult,
} from "../../core/learning/learning.api";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Spinner } from "../../ui/Spinner";
import { useSnackbar } from "../../ui/Snackbar";

export default function QuizScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { snack } = useSnackbar();

  const { data: quiz, isLoading, isError } = useQuiz(courseId, quizId);
  const submit = useSubmitQuiz(courseId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const back = () => navigate(`/learn/${courseId}`);

  if (isLoading) {
    return <CenteredSpinner onBack={() => navigate(-1)} label={t("back")} />;
  }

  if (isError || !quiz) {
    return (
      <QuizFrame onBack={() => navigate(-1)} backLabel={t("back")}>
        <div className="pad" style={{ paddingTop: 32, textAlign: "center" }}>
          <div className="t-section">{t("errorGeneric")}</div>
          <div style={{ height: 12 }} />
          <Button variant="tonal" onClick={back}>
            {t("quiz.back")}
          </Button>
        </div>
      </QuizFrame>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <QuizFrame onBack={back} backLabel={t("back")} title={quiz.title}>
        <div className="pad" style={{ paddingTop: 32, textAlign: "center" }}>
          <div className="t-body muted">{t("quiz.empty")}</div>
          <div style={{ height: 12 }} />
          <Button variant="tonal" onClick={back}>
            {t("quiz.back")}
          </Button>
        </div>
      </QuizFrame>
    );
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  async function onSubmit() {
    if (!quiz || !allAnswered) return;
    try {
      const res = await submit.mutateAsync({
        quizId: quiz.id,
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          optionId: answers[q.id],
        })),
      });
      setResult(res);
    } catch {
      snack(t("errorGeneric"), "error");
    }
  }

  function retry() {
    setAnswers({});
    setResult(null);
  }

  // ---------- result view ----------
  if (result) {
    const byQuestion = new Map(result.results.map((r) => [r.questionId, r]));
    return (
      <QuizFrame onBack={back} backLabel={t("back")} title={quiz.title}>
        <div className="pad" style={{ paddingTop: 16 }}>
          <div className={`quiz-result ${result.passed ? "pass" : "fail"}`}>
            <div className="quiz-result__badge">
              {result.passed ? <Check className="icon" /> : <X className="icon" />}
            </div>
            <div className="t-title">
              {result.passed ? t("quiz.passed") : t("quiz.failed")}
            </div>
            <div className="t-body muted">
              {t("quiz.scoreLine", {
                correct: result.correctCount,
                total: result.totalQuestions,
                score: result.score,
              })}
            </div>
          </div>

          <div style={{ height: 18 }} />
          {quiz.questions.map((q, qi) => {
            const r = byQuestion.get(q.id);
            return (
              <div className="quiz-q" key={q.id}>
                <div className="quiz-q__text">
                  {qi + 1}. {q.text}
                </div>
                <div className="quiz-q__opts">
                  {q.options.map((o) => {
                    const isCorrect = r?.correctOptionId === o.id;
                    const isChosen = r?.chosenOptionId === o.id;
                    const cls = isCorrect
                      ? "quiz-opt correct"
                      : isChosen
                        ? "quiz-opt wrong"
                        : "quiz-opt";
                    return (
                      <div className={cls} key={o.id}>
                        <span>{o.text}</span>
                        {isCorrect && <Check className="icon-sm" />}
                        {isChosen && !isCorrect && <X className="icon-sm" />}
                      </div>
                    );
                  })}
                </div>
                {r?.explanation && (
                  <div className="quiz-q__explain">{r.explanation}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sticky-cta">
          {result.passed ? (
            <Button variant="primary" block onClick={back}>
              {t("quiz.continue")}
            </Button>
          ) : (
            <Button
              variant="primary"
              block
              leftIcon={<RotateCcw className="icon-sm" />}
              onClick={retry}
            >
              {t("quiz.retry")}
            </Button>
          )}
        </div>
      </QuizFrame>
    );
  }

  // ---------- taking view ----------
  return (
    <QuizFrame onBack={back} backLabel={t("back")} title={quiz.title}>
      <div className="pad" style={{ paddingTop: 8 }}>
        <div className="t-caption" style={{ marginBottom: 12 }}>
          {t("quiz.instructions", {
            n: quiz.questions.length,
            pass: quiz.passingScore,
          })}
        </div>
        {quiz.questions.map((q, qi) => (
          <div className="quiz-q" key={q.id}>
            <div className="quiz-q__text">
              {qi + 1}. {q.text}
            </div>
            <div className="quiz-q__opts">
              {q.options.map((o) => {
                const on = answers[q.id] === o.id;
                return (
                  <button
                    type="button"
                    key={o.id}
                    className={`quiz-opt selectable${on ? " on" : ""}`}
                    onClick={() =>
                      setAnswers((a) => ({ ...a, [q.id]: o.id }))
                    }
                  >
                    <span>{o.text}</span>
                    <span className={`radio-dot${on ? " on" : ""}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky-cta">
        <Button
          variant="primary"
          block
          loading={submit.isPending}
          disabled={!allAnswered}
          onClick={onSubmit}
        >
          {allAnswered
            ? t("quiz.submit")
            : t("quiz.answerAll", {
                left: quiz.questions.length - Object.keys(answers).length,
              })}
        </Button>
      </div>
    </QuizFrame>
  );
}

function QuizFrame({
  children,
  onBack,
  backLabel,
  title,
}: {
  children: React.ReactNode;
  onBack: () => void;
  backLabel: string;
  title?: string;
}) {
  return (
    <div className="screen">
      <div className="screen__top">
        <div className="appbar pad">
          <button className="appbar__btn" onClick={onBack} aria-label={backLabel}>
            <ArrowLeft className="icon" />
          </button>
          {title && (
            <div className="t-bodysb" style={{ marginLeft: 4 }}>
              {title}
            </div>
          )}
        </div>
      </div>
      <div className="screen__scroll" style={{ paddingBottom: 96 }}>
        {children}
      </div>
    </div>
  );
}

function CenteredSpinner({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <QuizFrame onBack={onBack} backLabel={label}>
      <div style={{ display: "grid", placeItems: "center", paddingTop: 60 }}>
        <Spinner />
      </div>
    </QuizFrame>
  );
}
