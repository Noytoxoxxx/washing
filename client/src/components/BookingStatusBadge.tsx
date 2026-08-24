import { Badge } from "./ui/Badge";

const CONFIG: Record<string, { tone: "primary" | "success" | "warning" | "danger" | "neutral"; label: string }> = {
  pending: { tone: "warning", label: "En attente" },
  confirmed: { tone: "primary", label: "Confirmée" },
  completed: { tone: "success", label: "Terminée" },
  cancelled: { tone: "neutral", label: "Annulée" },
  refused: { tone: "danger", label: "Refusée" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const c = CONFIG[status] || { tone: "neutral" as const, label: status };
  return <Badge tone={c.tone}>{c.label}</Badge>;
}
