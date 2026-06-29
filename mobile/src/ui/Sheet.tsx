import type { ReactNode } from "react";
import { X } from "lucide-react";

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <div
        className={`scrim${open ? " show" : ""}`}
        onClick={onClose}
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
      <div className={`sheet${open ? " show" : ""}`} role="dialog" aria-modal="true">
        <div className="sheet__grab" />
        <div className="sheet__head">
          <div className="t-title">{title}</div>
          <button className="appbar__btn" onClick={onClose} aria-label="Закрыть">
            <X className="icon" />
          </button>
        </div>
        <div className="sheet__body">{children}</div>
        {footer && <div className="sheet__foot">{footer}</div>}
      </div>
    </>
  );
}
