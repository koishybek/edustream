import { Link } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import { initials } from "../../core/format";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Screen } from "../../ui/Screen";

export default function HomeScreen() {
  const { t } = useI18n();
  const user = useAuth((s) => s.user);
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <Screen className="py-12">
      <header className="flex items-center justify-between">
        <p className="font-display text-xl font-bold text-brand">{t("appName")}</p>
        <Link
          to="/profile"
          aria-label={t("nav.profile")}
          className="grid h-10 w-10 place-items-center rounded-full bg-brand-subtle text-sm font-bold text-brand"
        >
          {user ? initials(user.name) : ""}
        </Link>
      </header>

      <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-text-primary">
        {t("home.greeting", { name: firstName })}
      </h1>
      <p className="mt-2 text-text-secondary">{t("home.subtitle")}</p>

      <section className="mt-8 rounded-lg border border-border bg-surface p-5 shadow-card">
        <span className="inline-block rounded-full bg-brand-subtle px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand">
          Phase 1
        </span>
        <p className="mt-3 text-text-secondary">{t("home.catalogSoon")}</p>
      </section>
    </Screen>
  );
}
