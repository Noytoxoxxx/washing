import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Flag, Trash2 } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { StarRating } from "../../components/ui/StarRating";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

export function AdminReviews() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-reviews"], queryFn: adminApi.moderation.reviews });
  const [toDelete, setToDelete] = useState<any>(null);

  async function flag(id: string) {
    await adminApi.moderation.flagReview(id);
    toast.success("Avis marqué comme signalé.");
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  async function handleDelete() {
    if (!toDelete) return;
    await adminApi.moderation.deleteReview(toDelete.id);
    toast.success("Avis supprimé.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  }

  const reviews = data?.reviews ?? [];

  return (
    <div>
      <PageHeader title="Avis" description="Modération des avis clients." />
      {isLoading ? null : reviews.length === 0 ? (
        <EmptyState icon={Star} title="Aucun avis" description="Aucun avis n'a encore été publié." />
      ) : (
        <div className="space-y-3">
          {reviews.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border bg-white p-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{r.client.firstName} {r.client.lastName} → {r.professional.companyName}</p>
                  <StarRating value={r.rating} readOnly size={14} />
                </div>
                <div className="flex items-center gap-2">
                  {r.reported && <Badge tone="warning">Signalé</Badge>}
                  <Button size="sm" variant="outline" onClick={() => flag(r.id)}><Flag size={13} /> Signaler</Button>
                  <Button size="sm" variant="outline" onClick={() => setToDelete(r)}><Trash2 size={13} className="text-danger" /></Button>
                </div>
              </div>
              {r.text && <p className="mt-2 text-sm text-text">{r.text}</p>}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer l'avis"
        message="Cet avis sera définitivement supprimé."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
