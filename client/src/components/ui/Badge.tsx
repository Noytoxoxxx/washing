import { ReactNode } from "react";

type Tone = "primary" | "success" | "warning" | "danger" | "neutral" | "founder";

const TONES: Record<Tone, string> = {
  primary: "bg-primary-light text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-bg text-muted border border-border",
  founder: "bg-ink text-white",
};

export function Badge({ tone = "neutral", children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
