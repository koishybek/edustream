import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

/** Category chip (single-select rail). */
export function Chip({ active, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={`chip${active ? " chip--active" : ""}${className ? " " + className : ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ChipSelectProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  children: ReactNode;
}

/** Multi-select chip with a check that slides in when pressed. */
export function ChipSelect({ pressed, children, ...rest }: ChipSelectProps) {
  return (
    <button type="button" className="chip-select" aria-pressed={pressed} {...rest}>
      <Check className="icon-sm" />
      {children}
    </button>
  );
}
