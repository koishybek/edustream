import { Bell, SlidersHorizontal, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Avatar } from "../../ui/Avatar";
import { BottomNav } from "../../ui/BottomNav";
import { Button } from "../../ui/Button";
import { Chip } from "../../ui/Chip";
import { EmptyState } from "../../ui/EmptyState";
import { SearchField } from "../../ui/SearchField";
import { useSnackbar } from "../../ui/Snackbar";

const CATS = [
  "all",
  "climate",
  "water",
  "circular-economy",
  "esg-reporting",
  "biodiversity",
  "social",
];

export default function HomeScreen() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { snack } = useSnackbar();

  const hour = new Date().getHours();
  const greetKey =
    hour < 12 ? "home.morning" : hour < 18 ? "home.day" : "home.evening";
  const firstName = (user?.name ?? "").split(" ")[0];
  const soon = () => snack(t("home.catalogSoon"));

  return (
    <div className="screen">
      <div className="screen__top">
        <div className="greet">
          <div className="greet__hi">
            <div className="t-caption">{t(greetKey)}</div>
            <div className="nm">{firstName} 👋</div>
          </div>
          <button
            className="appbar__btn"
            onClick={() => snack(t("profile.soon"))}
            aria-label={t("profile.notifications")}
          >
            <Bell className="icon" />
          </button>
          <span
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
            aria-label={t("nav.profile")}
            role="button"
          >
            <Avatar name={user?.name ?? "?"} />
          </span>
        </div>
        <div className="pad" style={{ paddingBottom: 6, display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <SearchField placeholder={t("home.search")} readOnly onClick={soon} />
          </div>
          <Button
            variant="ghost"
            onClick={soon}
            style={{ minHeight: 48, padding: "0 14px" }}
            aria-label="Filters"
          >
            <SlidersHorizontal className="icon-sm" />
          </Button>
        </div>
      </div>

      <div className="screen__scroll">
        <div className="rail">
          {CATS.map((c) => (
            <Chip key={c} active={c === "all"} onClick={soon}>
              {c === "all" ? t("cat.all") : t(`interest.${c}`)}
            </Chip>
          ))}
        </div>
        <div className="section-head">
          <div className="t-section">{t("home.recommended")}</div>
        </div>
        <div style={{ padding: "8px 18px 0" }}>
          <EmptyState
            icon={<Sparkles className="icon-lg" />}
            title={t("home.soonTitle")}
            text={t("home.catalogSoon")}
          />
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
