import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Pagination } from "../../components/ui/Pagination";
import { EmptyState } from "../../components/ui/EmptyState";
import { BookingStatusBadge } from "../../components/BookingStatusBadge";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmée" },
  { value: "completed", label: "Terminée" },
  { value: "cancelled", label: "Annulée" },
  { value: "refused", label: "Refusée" },
];

export function AdminBookings() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({ queryKey: ["admin-bookings", status, page], queryFn: () => adminApi.bookings.list({ status, page, limit: 20 }) });
  const bookings = data?.bookings ?? [];

  return (
    <div>
      <PageHeader title="Réservations" />
      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS} />
      </div>

      {isLoading ? null : bookings.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Aucune réservation" description="Aucune réservation ne correspond à ces critères." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Professionnel</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Prestation</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-ink">{b.professional?.companyName}</td>
                  <td className="px-4 py-3 text-muted">{b.client?.firstName} {b.client?.lastName}</td>
                  <td className="px-4 py-3 text-muted">{b.service?.name}</td>
                  <td className="px-4 py-3 text-muted">{new Date(b.date).toLocaleDateString("fr-FR")} {b.timeSlot}</td>
                  <td className="px-4 py-3">{b.price} €</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
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
