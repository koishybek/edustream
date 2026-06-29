import { useState, type FormEvent } from "react";
import { Apple, Lock, LogIn, Mail, Sprout, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../core/auth/auth.store";
import { useI18n } from "../../core/i18n/I18nProvider";
import { Button } from "../../ui/Button";
import { Segmented } from "../../ui/Segmented";
import { TextField } from "../../ui/TextField";
import { useSnackbar } from "../../ui/Snackbar";

type Mode = "login" | "register";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function AuthScreen({
  initialMode = "login",
}: {
  initialMode?: Mode;
}) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const register = useAuth((s) => s.register);
  const { snack } = useSnackbar();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) return setError(t("auth.emailInvalid"));
    if (password.length < 8) return setError(t("auth.passwordShort"));
    if (!isLogin && name.trim().length < 1) return setError(t("auth.nameRequired"));

    setSubmitting(true);
    try {
      if (isLogin) await login(email.trim(), password);
      else await register({ email: email.trim(), password, name: name.trim(), locale });
      navigate("/");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!isLogin && status === 409) setError(t("register.emailTaken"));
      else setError(isLogin ? t("login.error") : t("register.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <div className="screen__top pad">
        <div className="brand-sm">
          <div className="b">
            <Sprout className="icon-sm" />
          </div>
          <div className="nm">Edustream</div>
        </div>
      </div>
      <div className="screen__scroll pad" style={{ paddingTop: 18 }}>
        <div className="t-display" style={{ marginBottom: 4 }}>
          {isLogin ? t("login.title") : t("register.title")}
        </div>
        <div className="t-body muted" style={{ marginBottom: 20 }}>
          {isLogin ? t("login.subtitle") : t("register.subtitle")}
        </div>

        <div style={{ marginBottom: 20 }}>
          <Segmented<Mode>
            options={[
              { value: "login", label: t("auth.tabLogin") },
              { value: "register", label: t("auth.tabRegister") },
            ]}
            value={mode}
            onChange={(m) => {
              setMode(m);
              setError(null);
            }}
          />
        </div>

        <form onSubmit={onSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: 14 }}>
              <TextField
                label={t("name")}
                icon={<UserIcon className="icon" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Майя Ахметова"
                autoComplete="name"
              />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <TextField
              label={t("email")}
              icon={<Mail className="icon" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <TextField
              label={t("password")}
              icon={<Lock className="icon" />}
              passwordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {isLogin ? (
            <div style={{ textAlign: "right", marginBottom: 18 }}>
              <Button
                type="button"
                variant="text"
                onClick={() => snack(t("profile.soon"))}
              >
                {t("auth.forgot")}
              </Button>
            </div>
          ) : (
            <div style={{ height: 12 }} />
          )}

          {error && (
            <div className="field-error" role="alert" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" block loading={submitting}>
            {isLogin ? t("auth.signIn") : t("auth.createAccount")}
          </Button>
        </form>

        <div className="or">{t("auth.or")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            variant="social"
            block
            leftIcon={<LogIn className="icon-sm" />}
            onClick={() => snack(t("auth.socialSoon"))}
          >
            {t("auth.google")}
          </Button>
          <Button
            variant="social"
            block
            leftIcon={<Apple className="icon-sm" />}
            onClick={() => snack(t("auth.socialSoon"))}
          >
            {t("auth.apple")}
          </Button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
