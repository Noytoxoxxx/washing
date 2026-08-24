import { Link } from "react-router-dom";
import { MapPin, Star, Crown, BadgeCheck, Home as HomeIcon } from "lucide-react";
import { paths } from "../lib/paths";
import { Badge } from "./ui/Badge";
import type { ProfessionalListItem } from "../api/professionals";

export function ProfessionalCard({ pro }: { pro: ProfessionalListItem }) {
  return (
    <Link
      to={paths.professional(pro.slug)}
      className="group block overflow-hidden rounded-lg border border-border bg-white shadow-card transition-shadow hover:shadow-pop"
    >
      <div className="relative h-36 w-full overflow-hidden bg-bg">
        {pro.coverUrl ? (
          <img src={pro.coverUrl} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">Pas de photo</div>
        )}
        {pro.isFounder && (
          <div className="absolute left-2 top-2">
            <Badge tone="founder" icon={<Crown size={12} />}>
              Founding Partner
            </Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-bg">
            {pro.logoUrl && <img src={pro.logoUrl} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-ink">{pro.companyName}</p>
              {pro.verified && <BadgeCheck size={15} className="shrink-0 text-primary" />}
            </div>
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin size={12} /> {pro.city || "Ville non renseignée"}
              {pro.distance != null && ` · ${pro.distance.toFixed(1)} km`}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-warning">
            <Star size={14} className="fill-warning" />
            <span className="font-medium text-ink">{pro.rating || "—"}</span>
            <span className="text-muted">({pro.reviewCount})</span>
          </div>
          {pro.minPrice != null && <p className="font-semibold text-ink">Dès {pro.minPrice} €</p>}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pro.category && <Badge>{pro.category.name}</Badge>}
          {pro.homeService && (
            <Badge icon={<HomeIcon size={11} />} tone="primary">
              À domicile
            </Badge>
          )}
          {pro.openNow && <Badge tone="success">Ouvert</Badge>}
        </div>
      </div>
    </Link>
  );
}
