import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Variant = "success" | "error";

interface SnackbarContextValue {
  snack: (message: string, variant?: Variant) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<Variant>("success");
  const [show, setShow] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const snack = useCallback((text: string, v: Variant = "success") => {
    setMessage(text);
    setVariant(v);
    setShow(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), 2600);
  }, []);

  return (
    <SnackbarContext.Provider value={{ snack }}>
      {children}
      <div
        className={`snackbar${variant === "error" ? " snackbar--error" : ""}${show ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {variant === "error" ? (
          <AlertCircle className="icon-sm" />
        ) : (
          <CheckCircle2 className="icon-sm" />
        )}
        <span>{message}</span>
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext);
  if (!ctx) throw new Error("useSnackbar must be used within SnackbarProvider");
  return ctx;
}
