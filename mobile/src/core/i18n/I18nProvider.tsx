import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppLocale } from "../auth/types";
import { dictionaries } from "./dictionaries";
import { extraDict } from "./phase23.dict";

const STORAGE_KEY = "edustream.locale";
const DEFAULT_LOCALE: AppLocale = "ru";

type TranslateParams = Record<string, string | number>;

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: string, params?: TranslateParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function readInitialLocale(): AppLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "ru" || stored === "en" || stored === "kz") return stored;
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(readInitialLocale);

  const setLocale = useCallback((next: AppLocale) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  // Keep the document language in sync for a11y / screen readers. Kazakh's
  // BCP-47 tag is "kk"; "ru"/"en" map through unchanged. Runs on mount too.
  useEffect(() => {
    document.documentElement.lang = locale === "kz" ? "kk" : locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: TranslateParams) => {
      let value =
        dictionaries[locale][key] ??
        extraDict[locale][key] ??
        dictionaries[DEFAULT_LOCALE][key] ??
        extraDict[DEFAULT_LOCALE][key] ??
        key;
      if (params) {
        for (const [name, replacement] of Object.entries(params)) {
          value = value.replace(`{${name}}`, String(replacement));
        }
      }
      return value;
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
