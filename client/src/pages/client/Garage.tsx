import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, Star, Pencil, Trash2, History } from "lucide-react";
import { vehiclesApi, type Vehicle } from "../../api/vehicles";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { VehicleFormModal } from "../../components/VehicleFormModal";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../context/ToastContext";

export function Garage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["vehicles"], queryFn: vehiclesApi.list });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);
  const [historyFor, setHistoryFor] = useState<Vehicle | null>(null);
  const { data: historyData } = useQuery({
    queryKey: ["vehicle-history", historyFor?.id],
    queryFn: () => vehiclesApi.history(historyFor!.id),
    enabled: !!historyFor,
  });

  async function handleSubmit(data: any) {
    if (editing) {
      await vehiclesApi.update(editing.id, data);
      toast.success("Véhicule mis à jour.");
    } else {
      await vehiclesApi.create(data);
      toast.success("Véhicule ajouté à votre garage.");
    }
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  }

  async function handleDelete() {
    if (!toDelete) return;
    await vehiclesApi.remove(toDelete.id);
    toast.success("Véhicule supprimé.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["vehicles"] });
  }

  const vehicles = data?.vehicles ?? [];

  return (
    <div>
      <PageHeader
        title="Mon garage"
        description="Gérez vos véhicules et leur historique d'entretien."
        action={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> Ajouter un véhicule
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Aucun véhicule"
          description="Ajoutez votre premier véhicule pour commencer à réserver des prestations."
          action={<Button onClick={() => setFormOpen(true)}>Ajouter un véhicule</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <div key={v.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
              <div className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-md bg-bg">
                {v.photoUrl ? <img src={v.photoUrl} alt="" className="h-full w-full object-cover" /> : <Car size={32} className="text-muted" />}
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink">{v.nickname || `${v.make} ${v.model}`}</p>
                  <p className="text-xs text-muted">{v.make} {v.model} {v.year ? `· ${v.year}` : ""}</p>
                </div>
                {v.isPrimary && (
                  <span title="Véhicule principal">
                    <Star size={16} className="fill-warning text-warning" />
                  </span>
                )}
              </div>
              {v.mileage != null && <p className="mt-2 text-xs text-muted">{v.mileage.toLocaleString("fr-FR")} km</p>}
              <div className="mt-3 flex gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setHistoryFor(v)}>
                  <History size={14} /> Historique
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setEditing(v); setFormOpen(true); }} aria-label="Modifier">
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => setToDelete(v)} aria-label="Supprimer">
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <VehicleFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} initial={editing} />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer le véhicule"
        message={`Voulez-vous vraiment supprimer "${toDelete?.nickname || toDelete?.model}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <Modal open={!!historyFor} onClose={() => setHistoryFor(null)} title={`Historique — ${historyFor?.nickname || historyFor?.model || ""}`}>
        {!historyData || historyData.bookings.length === 0 ? (
          <p className="text-sm text-muted">Aucune prestation terminée pour ce véhicule.</p>
        ) : (
          <ul className="space-y-3">
            {historyData.bookings.map((b: any) => (
              <li key={b.id} className="rounded-md border border-border p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-ink">{b.service.name}</span>
                  <span className="text-muted">{new Date(b.date).toLocaleDateString("fr-FR")}</span>
                </div>
                <p className="text-xs text-muted">{b.professional.companyName} · {b.price} €</p>
                {b.review && <p className="mt-1 text-xs text-warning">★ {b.review.rating}/5</p>}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
