import { useEffect, type ReactNode } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { UNAUTHORIZED_EVENT } from "./api/client";
import { isOnboarded, useAuth } from "./auth/auth.store";
import { useI18n } from "./i18n/I18nProvider";
import AuthScreen from "../features/auth/AuthScreen";
import CourseScreen from "../features/course/CourseScreen";
import HomeScreen from "../features/home/HomeScreen";
import LearningScreen from "../features/learning/LearningScreen";
import OnboardingScreen from "../features/onboarding/OnboardingScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import SplashScreen from "../features/splash/SplashScreen";
import WelcomeScreen, { INTRO_SEEN_KEY } from "../features/welcome/WelcomeScreen";

/**
 * App shell: runs session bootstrap once, wires the global "session lost"
 * signal to a sign-out, syncs the UI language to the signed-in user, and shows
 * the branded splash while the stored token is validated. Children render via
 * <Outlet/> only after the auth status resolves, so guards never see "loading".
 */
function AppShell() {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);
  const logout = useAuth((s) => s.logout);
  const userLocale = useAuth((s) => s.user?.locale);
  const { setLocale } = useI18n();

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  useEffect(() => {
    if (userLocale) setLocale(userLocale);
  }, [userLocale, setLocale]);

  return (
    <div className="app">{status === "loading" ? <SplashScreen /> : <Outlet />}</div>
  );
}

function Protected({
  children,
  requireOnboarded = false,
}: {
  children: ReactNode;
  requireOnboarded?: boolean;
}) {
  const status = useAuth((s) => s.status);
  const user = useAuth((s) => s.user);
  if (status !== "authenticated") {
    const target = localStorage.getItem(INTRO_SEEN_KEY) ? "/login" : "/welcome";
    return <Navigate to={target} replace />;
  }
  if (requireOnboarded && !isOnboarded(user)) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const status = useAuth((s) => s.status);
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/welcome",
        element: (
          <GuestOnly>
            <WelcomeScreen />
          </GuestOnly>
        ),
      },
      {
        path: "/login",
        element: (
          <GuestOnly>
            <AuthScreen initialMode="login" />
          </GuestOnly>
        ),
      },
      {
        path: "/register",
        element: (
          <GuestOnly>
            <AuthScreen initialMode="register" />
          </GuestOnly>
        ),
      },
      {
        path: "/onboarding",
        element: (
          <Protected>
            <OnboardingScreen />
          </Protected>
        ),
      },
      {
        path: "/",
        element: (
          <Protected requireOnboarded>
            <HomeScreen />
          </Protected>
        ),
      },
      {
        path: "/course/:slug",
        element: (
          <Protected requireOnboarded>
            <CourseScreen />
          </Protected>
        ),
      },
      {
        path: "/learning",
        element: (
          <Protected requireOnboarded>
            <LearningScreen />
          </Protected>
        ),
      },
      {
        path: "/profile",
        element: (
          <Protected>
            <ProfileScreen />
          </Protected>
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
