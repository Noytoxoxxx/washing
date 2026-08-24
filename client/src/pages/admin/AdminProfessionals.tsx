import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, BadgeCheck, Crown, Briefcase } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { Dropdown, DropdownItem } from "../../components/ui/Dropdown";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { paths } from "../../lib/paths";
import { useToast } from "../../context/ToastContext";
import { MoreHorizontal, ShieldCheck, ShieldX, Trash2, Eye } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "active", label: "Actif" },
  { value: "suspended", label: "Suspendu" },
  { value: "inactive", label: "Inactif" },
];

export function AdminProfessionals() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-professionals", q, status, page],
    queryFn: () => adminApi.professionals.list({ q, status, page, limit: 15 }),
  });

  async function toggleStatus(p: any) {
    const next = p.status === "active" ? "suspended" : "active";
    await adminApi.professionals.setStatus(p.id, next);
    toast.success(next === "active" ? "Professionnel réactivé." : "Professionnel suspendu.");
    qc.invalidateQueries({ queryKey: ["admin-professionals"] });
  }

  async function toggleVerify(p: any) {
    await adminApi.professionals.setVerified(p.id, !p.verified);
    toast.success(!p.verified ? "Professionnel vérifié." : "Vérification retirée.");
    qc.invalidateQueries({ queryKey: ["admin-professionals"] });
  }

  async function handleDelete() {
    if (!toDelete) return;
    await adminApi.professionals.remove(toDelete.id);
    toast.success("Professionnel supprimé.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-professionals"] });
  }

  const professionals = data?.professionals ?? [];

  return (
    <div>
      <PageHeader
        title="Professionnels"
        action={<Link to={`${paths.adminProfessionals}/nouveau`}><Button><Plus size={16} /> Nouveau professionnel</Button></Link>}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Rechercher..." className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} className="w-48" />
      </div>

      {isLoading ? null : professionals.length === 0 ? (
        <EmptyState icon={Briefcase} title="Aucun professionnel" description="Créez votre premier professionnel pour lancer VEYZA." action={<Link to={`${paths.adminProfessionals}/nouveau`}><Button>Nouveau professionnel</Button></Link>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Réservations</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Inscrit le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {professionals.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3">
                    <Link to={`${paths.adminProfessionals}/${p.id}`} className="flex items-center gap-1.5 font-medium text-ink hover:text-primary">
                      {p.companyName}
                      {p.verified && <BadgeCheck size={13} className="text-primary" />}
                      {p.isFounder && <Crown size={13} className="text-warning" />}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.city}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === "active" ? "success" : p.status === "suspended" ? "danger" : "neutral"}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.subscriptionPlan}</td>
                  <td className="px-4 py-3">{p.bookingCount}</td>
                  <td className="px-4 py-3">{p.revenue} €</td>
                  <td className="px-4 py-3 text-muted">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={({ toggle }) => (
                        <button onClick={toggle} aria-label="Actions" className="text-muted hover:text-ink"><MoreHorizontal size={18} /></button>
                      )}
                    >
                      {(close) => (
                        <div>
                          <DropdownItem icon={<Eye size={15} />} onClick={() => { close(); navigate(`${paths.adminProfessionals}/${p.id}`); }}>Voir / Modifier</DropdownItem>
                          <DropdownItem icon={p.verified ? <ShieldX size={15} /> : <ShieldCheck size={15} />} onClick={() => { close(); toggleVerify(p); }}>
                            {p.verified ? "Retirer la vérification" : "Marquer vérifié"}
                          </DropdownItem>
                          <DropdownItem onClick={() => { close(); toggleStatus(p); }}>
                            {p.status === "active" ? "Suspendre" : "Réactiver"}
                          </DropdownItem>
                          <DropdownItem icon={<Trash2 size={15} />} danger onClick={() => { close(); setToDelete(p); }}>Supprimer</DropdownItem>
                        </div>
                      )}
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <div className="mt-5">
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer le professionnel"
        message={`Voulez-vous vraiment supprimer "${toDelete?.companyName}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
