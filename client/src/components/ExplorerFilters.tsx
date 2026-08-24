import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/misc";
import { Select } from "./ui/Select";
import { Switch } from "./ui/Switch";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import type { ExplorerFilters as FiltersType } from "../api/professionals";

interface Props {
  filters: FiltersType;
  onChange: (patch: Partial<FiltersType>) => void;
  onReset: () => void;
  onApply?: () => void;
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Pertinence" },
  { value: "distance", label: "Distance" },
  { value: "rating", label: "Note" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "popularity", label: "Popularité" },
];

export function ExplorerFilters({ filters, onChange, onReset, onApply }: Props) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  return (
    <div className="space-y-5">
      <Select
        label="Trier par"
        value={filters.sort || "relevance"}
        onChange={(v) => onChange({ sort: v })}
        options={SORT_OPTIONS}
      />
      <Select
        label="Catégorie"
        value={filters.category || ""}
        onChange={(v) => onChange({ category: v || undefined })}
        placeholder="Toutes les catégories"
        options={[{ value: "", label: "Toutes les catégories" }, ...(categories?.categories.map((c) => ({ value: c.slug, label: c.name })) ?? [])]}
      />
      <Input label="Ville" value={filters.city || ""} onChange={(e) => onChange({ city: e.target.value || undefined })} placeholder="Ex. Paris" />
      <Select
        label="Distance maximale"
        value={filters.radiusKm ? String(filters.radiusKm) : ""}
        onChange={(v) => onChange({ radiusKm: v ? Number(v) : undefined })}
        placeholder="Toutes distances"
        options={[
          { value: "", label: "Toutes distances" },
          { value: "5", label: "5 km" },
          { value: "10", label: "10 km" },
          { value: "25", label: "25 km" },
          { value: "50", label: "50 km" },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prix min" type="number" min={0} value={filters.minPrice ?? ""} onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })} />
        <Input label="Prix max" type="number" min={0} value={filters.maxPrice ?? ""} onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <Select
        label="Note minimale"
        value={filters.minRating ? String(filters.minRating) : ""}
        onChange={(v) => onChange({ minRating: v ? Number(v) : undefined })}
        placeholder="Toutes les notes"
        options={[
          { value: "", label: "Toutes les notes" },
          { value: "3", label: "3+ étoiles" },
          { value: "4", label: "4+ étoiles" },
          { value: "4.5", label: "4.5+ étoiles" },
        ]}
      />
      <div className="space-y-3 border-t border-border pt-4">
        <Switch label="À domicile" checked={!!filters.homeService} onChange={(v) => onChange({ homeService: v || undefined })} />
        <Switch label="Vérifié" checked={!!filters.verified} onChange={(v) => onChange({ verified: v || undefined })} />
        <Switch label="Founding Partner" checked={!!filters.founder} onChange={(v) => onChange({ founder: v || undefined })} />
        <Switch label="Ouvert maintenant" checked={!!filters.openNow} onChange={(v) => onChange({ openNow: v || undefined })} />
      </div>
      <div className="flex gap-2 border-t border-border pt-4">
        <Button variant="outline" fullWidth onClick={onReset}>
          Réinitialiser
        </Button>
        {onApply && (
          <Button fullWidth onClick={onApply}>
            Appliquer
          </Button>
        )}
      </div>
    </div>
  );
}
