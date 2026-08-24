import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarCheck, Star } from "lucide-react";
import { bookingsApi } from "../../api/bookings";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { BookingStatusBadge } from "../../components/BookingStatusBadge";
import { ReviewModal } from "../../components/ReviewModal";
import { paths } from "../../lib/paths";
import { useToast } from "../../context/ToastContext";

type Tab = "upcoming" | "past" | "cancelled";

export function Bookings() {
  const qc = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("upcoming");
  const [toCancel, setToCancel] = useState<string | null>(null);
  const [reviewFor, setReviewFor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["bookings-mine"], queryFn: bookingsApi.mine });
  const bookings = data?.bookings ?? [];

  const filtered = bookings.filter((b) => {
    if (tab === "cancelled") return ["cancelled", "refused"].includes(b.status);
    if (tab === "past") return b.status === "completed";
    return ["pending", "confirmed"].includes(b.status);
  });

  async function handleCancel() {
    if (!toCancel) return;
    await bookingsApi.cancel(toCancel);
    toast.success("Réservation annulée.");
    setToCancel(null);
    qc.invalidateQueries({ queryKey: ["bookings-mine"] });
  }

  return (
    <div>
      <PageHeader title="Mes réservations" />
      <div className="mb-5 flex gap-1 rounded-md border border-border bg-white p-1 sm:w-fit">
        {([
          ["upcoming", "À venir"],
          ["past", "Passées"],
          ["cancelled", "Annulées"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-sm px-4 py-1.5 text-sm font-medium sm:flex-none ${tab === key ? "bg-primary text-white" : "text-text"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? null : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Aucune réservation"
          description="Réservez une prestation auprès d'un professionnel pour la retrouver ici."
          action={<Link to={paths.explorer}><Button>Explorer les pros</Button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-bg">
                    {b.professional?.logoUrl && <img src={b.professional.logoUrl} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div>
                    <Link to={paths.professional(b.professional?.slug)} className="font-medium text-ink hover:text-primary">
                      {b.professional?.companyName}
                    </Link>
                    <p className="text-sm text-muted">{b.service?.name}</p>
                    <p className="text-xs text-muted">
                      {new Date(b.date).toLocaleDateString("fr-FR")} à {b.timeSlot} {b.vehicle && `· ${b.vehicle.make} ${b.vehicle.model}`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <BookingStatusBadge status={b.status} />
                  <p className="text-sm font-semibold text-ink">{b.price} €</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["pending", "confirmed"].includes(b.status) && (
                  <Button size="sm" variant="outline" onClick={() => setToCancel(b.id)}>
                    Annuler
                  </Button>
                )}
                {b.status === "completed" && !b.review && (
                  <Button size="sm" onClick={() => setReviewFor(b.id)}>
                    <Star size={14} /> Laisser un avis
                  </Button>
                )}
                {b.review && <span className="flex items-center gap-1 text-sm text-muted"><Star size={14} className="fill-warning text-warning" /> Avis envoyé</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toCancel}
        title="Annuler la réservation"
        message="Voulez-vous vraiment annuler cette réservation ?"
        confirmLabel="Annuler la réservation"
        danger
        onConfirm={handleCancel}
        onCancel={() => setToCancel(null)}
      />

      {reviewFor && (
        <ReviewModal open={!!reviewFor} onClose={() => setReviewFor(null)} bookingId={reviewFor} onSubmitted={() => qc.invalidateQueries({ queryKey: ["bookings-mine"] })} />
      )}
    </div>
  );
}
