import { type InputHTMLAttributes, useId } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function TextField({
  label,
  error,
  id,
  className = "",
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div>
      <label htmlFor={fieldId} className="text-sm font-semibold text-text-primary">
        {label}
      </label>
      <input
        id={fieldId}
        aria-invalid={Boolean(error)}
        className={`mt-1.5 w-full rounded-md border bg-surface px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:ring-2 focus:ring-brand/15 ${
          error
            ? "border-error focus:border-error"
            : "border-border focus:border-brand"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
