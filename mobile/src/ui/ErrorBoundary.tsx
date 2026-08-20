import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render-time errors anywhere below it and shows a branded fallback
 * instead of a blank white screen. Dependency-free (no external error libs) and
 * self-contained so it stays functional even if app providers are the ones that
 * threw. Copy is plain Russian (the default locale) because a class component
 * cannot consume the i18n hook.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface it for debugging; the fallback keeps the app recoverable.
    console.error("ErrorBoundary caught a render error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: 24,
          background: "var(--bg)",
        }}
      >
        <div className="empty">
          <div className="empty__icon">
            <AlertTriangle className="icon-lg" />
          </div>
          <div className="t-section">Что-то пошло не так</div>
          <div className="t-caption" style={{ maxWidth: "32ch" }}>
            Попробуйте перезагрузить приложение.
          </div>
          <button
            className="btn btn--primary"
            style={{ marginTop: 8 }}
            onClick={() => window.location.reload()}
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }
}
