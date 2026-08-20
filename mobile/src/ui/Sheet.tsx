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
  // The sheet stays mounted (slid off-screen) so it can animate. When closed,
  // mark it inert + aria-hidden so its controls leave the tab order and the
  // accessibility tree. Typed loosely because React 18's DOM typings predate
  // the `inert` attribute; it still renders to the DOM.
  const closedAttrs = open ? {} : { inert: "", "aria-hidden": true };
  return (
    <>
      <div
        className={`scrim${open ? " show" : ""}`}
        onClick={onClose}
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
      <div
        className={`sheet${open ? " show" : ""}`}
        role="dialog"
        aria-modal="true"
        {...closedAttrs}
      >
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
