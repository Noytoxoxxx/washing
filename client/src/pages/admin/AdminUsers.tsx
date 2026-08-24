import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Trash2 } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "CLIENT", label: "Client" },
  { value: "PROFESSIONAL", label: "Professionnel" },
  { value: "ADMIN", label: "Admin" },
];

export function AdminUsers() {
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-users", q, role, page], queryFn: () => adminApi.users.list({ q, role, page, limit: 20 }) });
  const users = data?.users ?? [];

  async function toggleStatus(u: any) {
    const next = u.status === "active" ? "suspended" : "active";
    await adminApi.users.setStatus(u.id, next);
    toast.success(next === "active" ? "Utilisateur réactivé." : "Utilisateur suspendu.");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  async function handleDelete() {
    if (!toDelete) return;
    await adminApi.users.remove(toDelete.id);
    toast.success("Utilisateur supprimé.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  return (
    <div>
      <PageHeader title="Utilisateurs" />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher..." className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <Select value={role} onChange={(v) => { setRole(v); setPage(1); }} options={ROLE_OPTIONS} className="w-52" />
      </div>

      {isLoading ? null : users.length === 0 ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Aucun utilisateur ne correspond à ces critères." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-ink">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3"><Badge>{u.role}</Badge></td>
                  <td className="px-4 py-3"><Badge tone={u.status === "active" ? "success" : "danger"}>{u.status}</Badge></td>
                  <td className="px-4 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "ADMIN" && (
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(u)}>{u.status === "active" ? "Suspendre" : "Réactiver"}</Button>
                        <Button size="sm" variant="outline" onClick={() => setToDelete(u)} aria-label="Supprimer"><Trash2 size={14} className="text-danger" /></Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <div className="mt-5"><Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} /></div>}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer l'utilisateur"
        message={`Voulez-vous vraiment supprimer "${toDelete?.firstName} ${toDelete?.lastName}" ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
