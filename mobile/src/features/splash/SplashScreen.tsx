import { Sprout } from "lucide-react";
import { useI18n } from "../../core/i18n/I18nProvider";

/** Branded splash shown while the stored session is validated. */
export default function SplashScreen() {
  const { t } = useI18n();
  return (
    <div className="splash">
      <div className="splash__logo">
        <Sprout className="icon" />
      </div>
      <div className="splash__name">Edustream</div>
      <div className="splash__tag">{t("splash.tagline")}</div>
      <div style={{ position: "absolute", bottom: 60 }}>
        <div className="spin" />
      </div>
    </div>
  );
}
