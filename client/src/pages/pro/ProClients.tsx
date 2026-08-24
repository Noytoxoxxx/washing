import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { proApi } from "../../api/pro";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";

export function ProClients() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["pro-clients", q], queryFn: () => proApi.clients(q) });
  const [detail, setDetail] = useState<any>(null);

  const clients = data?.clients ?? [];

  return (
    <div>
      <PageHeader title="Mes clients" />
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un client..."
          aria-label="Rechercher un client"
          className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? null : clients.length === 0 ? (
        <EmptyState icon={Users} title="Aucun client" description="Vos clients apparaîtront ici après leur première réservation." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Réservations</th>
                <th className="px-4 py-3">Dernier RDV</th>
                <th className="px-4 py-3">Total dépensé</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c: any) => (
                <tr key={c.client.id} onClick={() => setDetail(c)} className="cursor-pointer border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-ink">{c.client.firstName} {c.client.lastName}</td>
                  <td className="px-4 py-3">{c.bookingCount}</td>
                  <td className="px-4 py-3">{new Date(c.lastBookingDate).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">{c.totalSpent} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${detail.client.firstName} ${detail.client.lastName}` : ""} size="sm">
        {detail && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Email</span><span className="text-ink">{detail.client.email}</span></div>
            {detail.client.phone && <div className="flex justify-between"><span className="text-muted">Téléphone</span><span className="text-ink">{detail.client.phone}</span></div>}
            <div className="flex justify-between"><span className="text-muted">Réservations</span><span className="text-ink">{detail.bookingCount}</span></div>
            <div className="flex justify-between"><span className="text-muted">Total dépensé</span><span className="text-ink">{detail.totalSpent} €</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
