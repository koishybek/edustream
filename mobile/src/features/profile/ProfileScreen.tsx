import { BookOpen, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import type { AppLocale } from "../../core/auth/types";
import { LOCALE_LABELS, LOCALES } from "../../core/i18n/dictionaries";
import { useI18n } from "../../core/i18n/I18nProvider";
import { AppBar } from "../../ui/AppBar";
import { Avatar } from "../../ui/Avatar";
import { BottomNav } from "../../ui/BottomNav";
import { Button } from "../../ui/Button";
import { ListRow } from "../../ui/ListRow";
import { Segmented } from "../../ui/Segmented";

export default function ProfileScreen() {
  const { t, locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const updateMe = useAuth((s) => s.updateMe);
  const logout = useAuth((s) => s.logout);

  if (!user) return null;

  async function changeLocale(next: AppLocale) {
    setLocale(next);
    try {
      await updateMe({ locale: next });
    } catch {
      // Keep the UI choice even if persisting fails.
    }
  }

  return (
    <div className="screen">
      <div className="screen__top">
        <AppBar title={t("profile.title")} large />
      </div>

      <div className="screen__scroll">
        <div className="prof-head">
          <Avatar name={user.name} />
          <div>
            <div className="t-title">{user.name}</div>
            <div className="t-caption" style={{ marginTop: 2 }}>
              {user.email}
            </div>
          </div>
        </div>

        <div className="group-label">{t("profile.language")}</div>
        <div style={{ padding: "0 18px 18px" }}>
          <Segmented<AppLocale>
            options={LOCALES.map((l) => ({ value: l, label: LOCALE_LABELS[l] }))}
            value={locale}
            onChange={changeLocale}
          />
        </div>

        <div className="group-label">{t("profile.groupLearning")}</div>
        <div className="settings-group">
          <ListRow
            lead={<BookOpen className="icon" />}
            title={t("profile.myCourses")}
            trail={<ChevronRight className="icon-sm" />}
            onClick={() => navigate("/learning")}
          />
        </div>

        <div style={{ padding: "4px 18px 30px" }}>
          <Button
            variant="ghost"
            block
            leftIcon={<LogOut className="icon-sm" />}
            onClick={logout}
            style={{ color: "var(--error)" }}
          >
            {t("profile.signOut")}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
