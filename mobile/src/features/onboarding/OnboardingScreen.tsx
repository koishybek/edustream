import { useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Leaf,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import type { Level } from "../../core/auth/types";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { ChipSelect } from "../../ui/Chip";
import { useSnackbar } from "../../ui/Snackbar";

const INTERESTS = [
  "climate",
  "water",
  "circular-economy",
  "esg-reporting",
  "biodiversity",
  "social",
];

const LEVELS: { key: Level; Icon: LucideIcon }[] = [
  { key: "BEGINNER", Icon: Sprout },
  { key: "INTERMEDIATE", Icon: Leaf },
  { key: "ADVANCED", Icon: Award },
];

const EYEBROW: React.CSSProperties = {
  color: "var(--accent)",
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
};

export default function OnboardingScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { snack } = useSnackbar();
  const updateMe = useAuth((s) => s.updateMe);

  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [level, setLevel] = useState<Level | null>(null);
  const [saving, setSaving] = useState(false);

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function finish() {
    if (!level) return;
    setSaving(true);
    try {
      await updateMe({ interests: selected, knowledgeLevel: level });
      navigate("/", { replace: true });
    } catch {
      snack(t("errorGeneric"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <div className="screen__top">
        <div className="appbar pad">
          {step === 2 && (
            <button
              className="appbar__btn"
              onClick={() => setStep(1)}
              aria-label={t("back")}
            >
              <ArrowLeft className="icon" />
            </button>
          )}
        </div>
      </div>

      {step === 1 ? (
        <>
          <div className="screen__scroll pad">
            <div className="t-meta" style={EYEBROW}>
              {t("onboarding.step1")}
            </div>
            <div className="t-display" style={{ margin: "6px 0" }}>
              {t("interests.title")}
            </div>
            <div className="t-body muted" style={{ marginBottom: 22 }}>
              {t("interests.subtitle")}
            </div>
            <div className="chip-wrap">
              {INTERESTS.map((slug) => (
                <ChipSelect
                  key={slug}
                  pressed={selected.includes(slug)}
                  onClick={() => toggle(slug)}
                >
                  {t(`interest.${slug}`)}
                </ChipSelect>
              ))}
            </div>
          </div>
          <div className="sticky-cta" style={{ boxShadow: "none" }}>
            <Button
              variant="primary"
              block
              disabled={selected.length === 0}
              onClick={() => setStep(2)}
            >
              {t("continue")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="screen__scroll pad">
            <div className="t-meta" style={EYEBROW}>
              {t("onboarding.step2")}
            </div>
            <div className="t-display" style={{ margin: "6px 0" }}>
              {t("level.title")}
            </div>
            <div className="t-body muted" style={{ marginBottom: 22 }}>
              {t("level.subtitle")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {LEVELS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="lvl-opt"
                  data-on={level === key}
                  onClick={() => setLevel(key)}
                >
                  <div className="lvl-ic">
                    <Icon className="icon" />
                  </div>
                  <div className="lvl-tt">
                    <div className="t-bodysb">{t(`level.${key}`)}</div>
                    <div className="t-caption" style={{ marginTop: 2 }}>
                      {t(`level.${key}.desc`)}
                    </div>
                  </div>
                  <CheckCircle2 className="icon lvl-check" />
                </button>
              ))}
            </div>
          </div>
          <div className="sticky-cta" style={{ boxShadow: "none" }}>
            <Button
              variant="primary"
              block
              disabled={!level}
              loading={saving}
              onClick={finish}
            >
              {t("level.cta")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
