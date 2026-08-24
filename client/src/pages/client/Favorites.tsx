import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Heart, Star, MapPin, X } from "lucide-react";
import { meApi } from "../../api/me";
import { professionalsApi } from "../../api/professionals";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { paths } from "../../lib/paths";
import { useToast } from "../../context/ToastContext";

export function Favorites() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["favorites"], queryFn: meApi.favorites });

  async function remove(professionalId: string) {
    await professionalsApi.toggleFavorite(professionalId);
    toast.success("Retiré des favoris.");
    qc.invalidateQueries({ queryKey: ["favorites"] });
  }

  const favorites = data?.favorites ?? [];

  return (
    <div>
      <PageHeader title="Mes favoris" description="Les professionnels que vous avez enregistrés." />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Aucun favori"
          description="Enregistrez vos professionnels préférés pour les retrouver ici."
          action={<Link to={paths.explorer}><Button>Explorer les pros</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((f) => (
            <div key={f.favoriteId} className="relative rounded-lg border border-border bg-white shadow-card">
              <button
                onClick={() => remove(f.professional.id)}
                aria-label="Retirer des favoris"
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
              >
                <X size={15} />
              </button>
              <Link to={paths.professional(f.professional.slug)} className="block p-4">
                <div className="mb-3 h-14 w-14 overflow-hidden rounded-full border border-border bg-bg">
                  {f.professional.logoUrl && <img src={f.professional.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <p className="font-semibold text-ink">{f.professional.companyName}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin size={12} /> {f.professional.city}</p>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-warning"><Star size={13} className="fill-warning" /> {f.professional.rating || "—"}</span>
                  {f.professional.minPrice != null && <span className="font-medium text-ink">Dès {f.professional.minPrice} €</span>}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
