import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  icon?: ReactNode;
  error?: string;
  passwordToggle?: boolean;
}

export function TextField({
  label,
  icon,
  error,
  passwordToggle,
  type = "text",
  id,
  ...rest
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [show, setShow] = useState(false);
  const inputType = passwordToggle ? (show ? "text" : "password") : type;

  return (
    <div className="field">
      {label && <label htmlFor={fieldId}>{label}</label>}
      <div className={`field-input${error ? " is-error" : ""}`}>
        {icon}
        <input
          id={fieldId}
          type={inputType}
          aria-invalid={Boolean(error)}
          {...rest}
        />
        {passwordToggle && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Скрыть пароль" : "Показать пароль"}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              color: "var(--text-2)",
              display: "flex",
            }}
          >
            {show ? <EyeOff className="icon" /> : <Eye className="icon" />}
          </button>
        )}
      </div>
      {error && (
        <div className="field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
