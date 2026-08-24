import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { List, Map as MapIcon, LocateFixed, SlidersHorizontal } from "lucide-react";
import { professionalsApi, ExplorerFilters as FiltersType } from "../../api/professionals";
import { ProfessionalCard } from "../../components/ProfessionalCard";
import { ExplorerFilters } from "../../components/ExplorerFilters";
import { ExplorerMap } from "../../components/map/ExplorerMap";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Compass } from "lucide-react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

export function Explorer() {
  useDocumentTitle("Explorer");
  const [params, setParams] = useSearchParams();
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const filters: FiltersType = useMemo(
    () => ({
      q: params.get("q") || undefined,
      category: params.get("category") || undefined,
      city: params.get("city") || undefined,
      minPrice: params.get("minPrice") ? Number(params.get("minPrice")) : undefined,
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
      minRating: params.get("minRating") ? Number(params.get("minRating")) : undefined,
      homeService: params.get("homeService") === "true" || undefined,
      verified: params.get("verified") === "true" || undefined,
      founder: params.get("founder") === "true" || undefined,
      openNow: params.get("openNow") === "true" || undefined,
      radiusKm: params.get("radiusKm") ? Number(params.get("radiusKm")) : undefined,
      sort: params.get("sort") || "relevance",
      lat: userLocation?.[0],
      lng: userLocation?.[1],
      page: params.get("page") ? Number(params.get("page")) : 1,
      limit: 20,
    }),
    [params, userLocation]
  );

  function updateFilters(patch: Partial<FiltersType>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === "" || v === false) next.delete(k);
      else next.set(k, String(v));
    });
    next.delete("page");
    setParams(next);
  }

  function resetFilters() {
    setParams(new URLSearchParams());
  }

  function setPage(page: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(page));
    setParams(next);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLocation(null)
    );
  }

  const { data, isLoading } = useQuery({
    queryKey: ["explorer", filters],
    queryFn: () => professionalsApi.list(filters),
  });

  const professionals = data?.professionals ?? [];
  const mapCenter = userLocation || (professionals[0]?.latitude && professionals[0]?.longitude ? [professionals[0].latitude, professionals[0].longitude] as [number, number] : PARIS_CENTER);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => !["sort", "page", "limit", "lat", "lng"].includes(k) && v).length;

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
      <aside className="hidden w-72 shrink-0 lg:block">
        <div className="sticky top-20 rounded-lg border border-border bg-white p-4 shadow-card">
          <ExplorerFilters filters={filters} onChange={updateFilters} onReset={resetFilters} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">Explorer</h1>
            <p className="text-sm text-muted">{data ? `${data.total} professionnel${data.total > 1 ? "s" : ""}` : "Chargement..."}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={useMyLocation}>
              <LocateFixed size={15} /> Utiliser ma position
            </Button>
            <button
              onClick={() => setFiltersOpen(true)}
              className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-text lg:hidden"
            >
              <SlidersHorizontal size={14} /> Filtres {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <div className="flex overflow-hidden rounded-md border border-border lg:hidden">
              <button
                onClick={() => setMobileView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${mobileView === "list" ? "bg-primary text-white" : "bg-white text-text"}`}
              >
                <List size={14} /> Liste
              </button>
              <button
                onClick={() => setMobileView("map")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${mobileView === "map" ? "bg-primary text-white" : "bg-white text-text"}`}
              >
                <MapIcon size={14} /> Carte
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_420px]">
          <div className={mobileView === "map" ? "hidden lg:block" : ""}>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : professionals.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="Nous n'avons rien trouvé."
                description="Essayez d'élargir votre recherche ou de modifier vos filtres."
                action={<Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {professionals.map((p) => (
                    <div key={p.id} onMouseEnter={() => setSelectedId(p.id)}>
                      <ProfessionalCard pro={p} />
                    </div>
                  ))}
                </div>
                {data && (
                  <div className="mt-6">
                    <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
                  </div>
                )}
              </>
            )}
          </div>
          <div className={`h-[70vh] overflow-hidden rounded-lg border border-border xl:h-[calc(100vh-11rem)] xl:sticky xl:top-20 ${mobileView === "list" ? "hidden lg:block" : ""}`}>
            <ExplorerMap professionals={professionals} center={mapCenter} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtres" size="sm">
        <ExplorerFilters
          filters={filters}
          onChange={updateFilters}
          onReset={() => {
            resetFilters();
            setFiltersOpen(false);
          }}
          onApply={() => setFiltersOpen(false)}
        />
      </Modal>
    </div>
  );
}
