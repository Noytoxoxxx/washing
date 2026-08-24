import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toast: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastState | null>(null);

const ICONS: Record<ToastKind, any> = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };
const STYLES: Record<ToastKind, string> = {
  success: "border-success/30 bg-white text-ink [&_svg]:text-success",
  error: "border-danger/30 bg-white text-ink [&_svg]:text-danger",
  warning: "border-warning/30 bg-white text-ink [&_svg]:text-warning",
  info: "border-primary/30 bg-white text-ink [&_svg]:text-primary",
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value: ToastState = {
    toast,
    success: (m) => toast("success", m),
    error: (m) => toast("error", m),
    warning: (m) => toast("warning", m),
    info: (m) => toast("info", m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-toast-in flex items-start gap-3 rounded-md border shadow-pop px-4 py-3 ${STYLES[t.kind]}`}
            >
              <Icon size={20} className="mt-0.5 shrink-0" />
              <p className="text-sm flex-1">{t.message}</p>
              <button
                aria-label="Fermer la notification"
                onClick={() => dismiss(t.id)}
                className="text-muted hover:text-ink shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
