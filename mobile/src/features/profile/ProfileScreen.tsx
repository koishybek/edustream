import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import type { AppLocale } from "../../core/auth/types";
import { initials } from "../../core/format";
import { LOCALE_LABELS, LOCALES } from "../../core/i18n/dictionaries";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";

export default function ProfileScreen() {
  const { t, locale, setLocale } = useI18n();
  const user = useAuth((s) => s.user);
  const updateMe = useAuth((s) => s.updateMe);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  async function changeLanguage(next: AppLocale) {
    setLocale(next);
    try {
      await updateMe({ locale: next });
    } catch {
      // Keep the UI choice even if persisting the preference fails.
    }
  }

  function onSignOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Screen className="py-10">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label={t("back")}
          className="grid h-10 w-10 place-items-center rounded-full border border-border text-lg text-text-secondary"
        >
          ←
        </button>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {t("profile.title")}
        </h1>
      </header>

      <div className="mt-8 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-brand text-xl font-bold text-white">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-bold text-text-primary">
            {user.name}
          </p>
          <p className="truncate text-sm text-text-secondary">{user.email}</p>
        </div>
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
        {t("profile.language")}
      </h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {LOCALES.map((lc) => (
          <button
            key={lc}
            type="button"
            onClick={() => changeLanguage(lc)}
            aria-pressed={locale === lc}
            className={`min-h-[48px] rounded-md border px-2 text-sm font-semibold transition-colors ${
              locale === lc
                ? "border-brand bg-brand-subtle text-brand"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {LOCALE_LABELS[lc]}
          </button>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-text-tertiary">
        {t("profile.account")}
      </h2>
      <dl className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <dt className="text-sm text-text-secondary">{t("profile.level")}</dt>
          <dd className="text-sm font-semibold text-text-primary">
            {user.knowledgeLevel
              ? t(`level.${user.knowledgeLevel}`)
              : t("profile.notSet")}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-sm text-text-secondary">{t("profile.interests")}</dt>
          <dd className="mt-2 flex flex-wrap gap-1.5">
            {user.interests.length > 0 ? (
              user.interests.map((id) => (
                <span
                  key={id}
                  className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary"
                >
                  {t(`interest.${id}`)}
                </span>
              ))
            ) : (
              <span className="text-sm text-text-tertiary">
                {t("profile.notSet")}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-auto pt-10">
        <Button variant="tonal" onClick={onSignOut} className="w-full">
          {t("profile.signOut")}
        </Button>
      </div>
    </Screen>
  );
}
