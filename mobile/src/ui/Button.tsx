import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "tonal" | "text";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30";

// Intent hierarchy: filled primary → tonal secondary → text tertiary.
const variants: Record<Variant, string> = {
  primary: "min-h-[52px] px-5 bg-brand text-white hover:bg-brand-pressed",
  tonal: "min-h-[52px] px-5 bg-brand-subtle text-brand hover:brightness-95",
  text: "min-h-[44px] px-3 text-brand hover:bg-brand-subtle/60",
};

export function Button({
  variant = "primary",
  loading = false,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
