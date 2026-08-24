import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";

export function AdminLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["admin-logs", page], queryFn: () => adminApi.logs(page) });
  const logs = data?.logs ?? [];

  return (
    <div>
      <PageHeader title="Logs administrateur" description="Historique des actions effectuées par l'équipe VEYZA." />
      {isLoading ? null : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucun log" description="Aucune action administrateur n'a encore été enregistrée." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Cible</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 text-muted">{l.admin.firstName} {l.admin.lastName}</td>
                  <td className="px-4 py-3 font-medium text-ink">{l.action}</td>
                  <td className="px-4 py-3 text-muted">{l.targetType} {l.targetId ? `#${l.targetId.slice(0, 8)}` : ""}</td>
                  <td className="px-4 py-3 text-muted">{new Date(l.createdAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <div className="mt-5"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}
    </div>
  );
}
