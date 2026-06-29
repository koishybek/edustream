import { useState } from "react";
import { BookOpen, ClipboardCheck, Users, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";

const SLIDES: { Icon: LucideIcon; cv: string; title: string; body: string }[] = [
  { Icon: BookOpen, cv: "cv1", title: "welcome.s1.title", body: "welcome.s1.body" },
  { Icon: ClipboardCheck, cv: "cv3", title: "welcome.s2.title", body: "welcome.s2.body" },
  { Icon: Users, cv: "cv2", title: "welcome.s3.title", body: "welcome.s3.body" },
];

export const INTRO_SEEN_KEY = "edustream.introSeen";

/** First-run intro carousel (3 slides) shown to guests before auth. */
export default function WelcomeScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  function finish() {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    navigate("/login");
  }
  function advance() {
    if (idx >= SLIDES.length - 1) finish();
    else setIdx((i) => i + 1);
  }

  return (
    <div className="screen">
      <div className="ob">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "calc(env(safe-area-inset-top) + 12px) 18px 0",
          }}
        >
          <Button variant="text" onClick={finish}>
            {t("skip")}
          </Button>
        </div>
        <div
          className="ob__track"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {SLIDES.map((s) => {
            const Icon = s.Icon;
            return (
              <div className="ob__slide" key={s.title}>
                <div className={`ob__art ${s.cv} cv-pat`}>
                  <Icon className="icon" />
                </div>
                <div className="t-title">{t(s.title)}</div>
                <div className="t-body muted">{t(s.body)}</div>
              </div>
            );
          })}
        </div>
        <div className="ob__foot">
          <div className="dots">
            {SLIDES.map((s, i) => (
              <span key={s.title} className={i === idx ? "on" : ""} />
            ))}
          </div>
          <Button variant="primary" block onClick={advance}>
            {idx === SLIDES.length - 1 ? t("start") : t("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
