import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import type { Level } from "../../core/auth/types";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { Screen } from "../../ui/Screen";

// Aligned with the seeded categories.
const INTERESTS = [
  "climate",
  "water",
  "circular-economy",
  "esg-reporting",
  "biodiversity",
  "social",
];
const LEVELS: Level[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function OnboardingScreen() {
  const { t } = useI18n();
  const updateMe = useAuth((s) => s.updateMe);
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string[]>([]);
  const [level, setLevel] = useState<Level>("BEGINNER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  async function onFinish() {
    if (selected.length === 0) {
      setError(t("onboarding.selectHint"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateMe({ interests: selected, knowledgeLevel: level });
      navigate("/", { replace: true });
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="py-12">
      <p className="font-display text-xs font-bold uppercase tracking-[0.16em] text-brand">
        {t("onboarding.eyebrow")}
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-text-primary">
        {t("onboarding.title")}
      </h1>
      <p className="mt-2 text-text-secondary">{t("onboarding.subtitle")}</p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
        {t("onboarding.interestsTitle")}
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTERESTS.map((id) => (
          <Chip
            key={id}
            label={t(`interest.${id}`)}
            selected={selected.includes(id)}
            onClick={() => toggle(id)}
          />
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
        {t("onboarding.levelTitle")}
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            aria-pressed={level === lv}
            className={`min-h-[52px] rounded-md border px-2 text-sm font-semibold transition-colors ${
              level === lv
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {t(`level.${lv}`)}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-error">
          {error}
        </p>
      )}

      <div className="mt-auto pt-10">
        <Button onClick={onFinish} loading={submitting} className="w-full">
          {t("onboarding.cta")}
        </Button>
      </div>
    </Screen>
  );
}
