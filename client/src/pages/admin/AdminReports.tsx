import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../context/ToastContext";

export function AdminReports() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-reports"], queryFn: adminApi.moderation.reports });

  async function resolve(id: string, status: "reviewed" | "dismissed") {
    await adminApi.moderation.resolveReport(id, status);
    toast.success(status === "reviewed" ? "Signalement traité." : "Signalement ignoré.");
    qc.invalidateQueries({ queryKey: ["admin-reports"] });
  }

  const reports = data?.reports ?? [];

  return (
    <div>
      <PageHeader title="Signalements" description="Contenus signalés par les utilisateurs." />
      {isLoading ? null : reports.length === 0 ? (
        <EmptyState icon={Flag} title="Aucun signalement" description="Aucun contenu n'a été signalé pour le moment." />
      ) : (
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4 shadow-card">
              <div>
                <p className="text-sm font-medium text-ink">{r.targetType} · {r.reason}</p>
                <p className="text-xs text-muted">Signalé par {r.reporter.firstName} {r.reporter.lastName} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={r.status === "pending" ? "warning" : r.status === "reviewed" ? "success" : "neutral"}>{r.status}</Badge>
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => resolve(r.id, "reviewed")}>Traiter</Button>
                    <Button size="sm" variant="outline" onClick={() => resolve(r.id, "dismissed")}>Ignorer</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
