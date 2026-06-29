import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "tonal" | "text" | "ghost" | "social";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  small?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  block,
  small,
  loading,
  leftIcon,
  className,
  disabled,
  children,
  ...rest
}: Props) {
  const cls = [
    "btn",
    `btn--${variant}`,
    block && "btn--block",
    small && "btn--sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="btn-spin" aria-hidden /> : leftIcon}
      {children}
    </button>
  );
}
