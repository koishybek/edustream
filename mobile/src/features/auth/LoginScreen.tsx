import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { TextField } from "../../ui/TextField";

export default function LoginScreen() {
  const { t } = useI18n();
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/", { replace: true });
    } catch {
      setError(t("login.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="justify-center py-12">
      <div className="mb-8">
        <p className="font-display text-2xl font-bold text-brand">{t("appName")}</p>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-text-primary">
          {t("login.title")}
        </h1>
        <p className="mt-2 text-text-secondary">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label={t("email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <TextField
          label={t("password")}
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {error && (
          <p
            role="alert"
            className="rounded-md bg-error-subtle px-3 py-2 text-sm font-medium text-error"
          >
            {error}
          </p>
        )}
        <Button type="submit" loading={submitting} className="w-full">
          {t("login.cta")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="font-semibold text-brand">
          {t("login.toRegister")}
        </Link>
      </p>
    </Screen>
  );
}
