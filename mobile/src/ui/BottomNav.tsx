import { BookOpen, Home, User, type LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from "../core/i18n/I18nProvider";

const TABS: { to: string; icon: LucideIcon; key: string }[] = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/learning", icon: BookOpen, key: "nav.learning" },
  { to: "/profile", icon: User, key: "nav.profile" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useI18n();

  return (
    <nav className="bottomnav">
      {TABS.map(({ to, icon: Icon, key }) => {
        const active = pathname === to;
        return (
          <button
            key={to}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(to)}
          >
            <Icon className="icon" />
            {t(key)}
          </button>
        );
      })}
    </nav>
  );
}
