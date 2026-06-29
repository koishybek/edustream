import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function AppBar({
  title,
  onBack,
  actions,
  large,
}: {
  title?: ReactNode;
  onBack?: () => void;
  actions?: ReactNode;
  large?: boolean;
}) {
  return (
    <div className={`appbar pad${large ? " appbar--lg" : ""}`}>
      {onBack && (
        <button className="appbar__btn" onClick={onBack} aria-label="Назад">
          <ArrowLeft className="icon" />
        </button>
      )}
      {title && (
        <div
          className="appbar__title"
          style={large ? { fontSize: 20, fontWeight: 700, letterSpacing: "-.02em" } : undefined}
        >
          {title}
        </div>
      )}
      {actions}
    </div>
  );
}
