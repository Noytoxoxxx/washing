import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { bookingsApi } from "../../api/bookings";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { BookingStatusBadge } from "../../components/BookingStatusBadge";
import { useToast } from "../../context/ToastContext";

type Filter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

export function ProBookings() {
  const qc = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>("all");
  const [action, setAction] = useState<{ id: string; type: "refuse" | "cancel" } | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["pro-bookings"], queryFn: bookingsApi.pro });
  const bookings = data?.bookings ?? [];

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "cancelled") return ["cancelled", "refused"].includes(b.status);
    return b.status === filter;
  });

  async function refresh() {
    qc.invalidateQueries({ queryKey: ["pro-bookings"] });
  }

  async function confirm(id: string) {
    await bookingsApi.confirm(id);
    toast.success("Réservation confirmée.");
    refresh();
  }

  async function complete(id: string) {
    await bookingsApi.complete(id);
    toast.success("Prestation marquée comme terminée.");
    refresh();
  }

  async function handleActionConfirm() {
    if (!action) return;
    if (action.type === "refuse") await bookingsApi.refuse(action.id);
    else await bookingsApi.cancel(action.id);
    toast.success(action.type === "refuse" ? "Réservation refusée." : "Réservation annulée.");
    setAction(null);
    refresh();
  }

  return (
    <div>
      <PageHeader title="Réservations" />
      <div className="mb-5 flex flex-wrap gap-1 rounded-md border border-border bg-white p-1 sm:w-fit">
        {([
          ["all", "Toutes"],
          ["pending", "En attente"],
          ["confirmed", "Confirmées"],
          ["completed", "Terminées"],
          ["cancelled", "Annulées"],
        ] as [Filter, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} className={`rounded-sm px-3 py-1.5 text-sm font-medium ${filter === key ? "bg-primary text-white" : "text-text"}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="Aucune réservation" description="Les demandes de réservation apparaîtront ici." />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{b.client?.firstName} {b.client?.lastName}</p>
                  <p className="text-sm text-muted">{b.service?.name} · {b.price} €</p>
                  <p className="text-xs text-muted">{new Date(b.date).toLocaleDateString("fr-FR")} à {b.timeSlot}</p>
                  {b.vehicle && <p className="text-xs text-muted">{b.vehicle.make} {b.vehicle.model}</p>}
                  {b.notes && <p className="mt-1 text-xs italic text-muted">« {b.notes} »</p>}
                </div>
                <BookingStatusBadge status={b.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {b.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => confirm(b.id)}>Accepter</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction({ id: b.id, type: "refuse" })}>Refuser</Button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <>
                    <Button size="sm" onClick={() => complete(b.id)}>Marquer terminée</Button>
                    <Button size="sm" variant="outline" onClick={() => setAction({ id: b.id, type: "cancel" })}>Annuler</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!action}
        title={action?.type === "refuse" ? "Refuser la réservation" : "Annuler la réservation"}
        message="Le client sera notifié de cette décision. Voulez-vous continuer ?"
        confirmLabel={action?.type === "refuse" ? "Refuser" : "Annuler la réservation"}
        danger
        onConfirm={handleActionConfirm}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
