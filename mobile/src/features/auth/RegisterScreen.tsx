import axios from "axios";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Screen } from "../../ui/Screen";
import { TextField } from "../../ui/TextField";

export default function RegisterScreen() {
  const { t, locale } = useI18n();
  const register = useAuth((s) => s.register);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        locale,
      });
      // New users go straight to onboarding.
      navigate("/onboarding", { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError(t("register.emailTaken"));
      } else {
        setError(t("register.error"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen className="justify-center py-12">
      <div className="mb-8">
        <p className="font-display text-2xl font-bold text-brand">{t("appName")}</p>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-text-primary">
          {t("register.title")}
        </h1>
        <p className="mt-2 text-text-secondary">{t("register.subtitle")}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField
          label={t("name")}
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sarah Jenkins"
        />
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
          autoComplete="new-password"
          required
          minLength={8}
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
          {t("register.cta")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t("register.haveAccount")}{" "}
        <Link to="/login" className="font-semibold text-brand">
          {t("register.toLogin")}
        </Link>
      </p>
    </Screen>
  );
}
