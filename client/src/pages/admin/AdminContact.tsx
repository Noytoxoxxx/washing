import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";

export function AdminContact() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-contact"], queryFn: adminApi.contact.list });
  const messages = data?.messages ?? [];

  async function open(id: string, status: string) {
    if (status === "new") {
      await adminApi.contact.markRead(id);
      qc.invalidateQueries({ queryKey: ["admin-contact"] });
    }
  }

  return (
    <div>
      <PageHeader title="Messages de contact" />
      {isLoading ? null : messages.length === 0 ? (
        <EmptyState icon={Mail} title="Aucun message" description="Les demandes envoyées via le formulaire de contact apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {messages.map((m: any) => (
            <details key={m.id} onToggle={() => open(m.id, m.status)} className="rounded-lg border border-border bg-white p-4 shadow-card">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{m.subject}</p>
                  <p className="text-xs text-muted">{m.name} · {m.email} · {new Date(m.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                {m.status === "new" && <Badge tone="primary">Nouveau</Badge>}
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-text">{m.message}</p>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
