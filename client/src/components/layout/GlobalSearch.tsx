import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Building2, Wrench, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../../api/misc";
import { useOutsideClose } from "../../hooks/useOutsideClose";
import { paths } from "../../lib/paths";

export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  useOutsideClose(ref, open, () => setOpen(false));

  const { data } = useQuery({
    queryKey: ["global-search", q],
    queryFn: () => searchApi.global(q),
    enabled: q.trim().length >= 2,
  });

  function goExplorer(city?: string) {
    setOpen(false);
    navigate(`${paths.explorer}${city ? `?city=${encodeURIComponent(city)}` : q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  useEffect(() => {
    setOpen(q.trim().length >= 2);
  }, [q]);

  const hasResults = data && (data.professionals.length || data.services.length || data.cities.length);

  return (
    <div ref={ref} className={`relative ${compact ? "w-full" : "w-full max-w-sm"}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goExplorer();
        }}
      >
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.trim().length >= 2 && setOpen(true)}
            type="search"
            aria-label="Rechercher un professionnel, un service, une ville"
            placeholder="Rechercher un professionnel, un service..."
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </form>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-md border border-border bg-white shadow-pop">
          {!hasResults ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-ink">Nous n'avons rien trouvé.</p>
              <button onClick={() => setQ("")} className="mt-1 text-xs text-primary hover:underline">
                Modifier la recherche
              </button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1.5">
              {data!.professionals.length > 0 && (
                <div>
                  <p className="px-4 pt-1.5 pb-1 text-xs font-semibold uppercase text-muted">Professionnels</p>
                  {data!.professionals.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(paths.professional(p.slug));
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-bg"
                    >
                      <Building2 size={15} className="text-muted" />
                      <span>{p.companyName}</span>
                      <span className="text-xs text-muted">{p.city}</span>
                    </button>
                  ))}
                </div>
              )}
              {data!.services.length > 0 && (
                <div>
                  <p className="px-4 pt-1.5 pb-1 text-xs font-semibold uppercase text-muted">Services</p>
                  {data!.services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(paths.professional(s.professional.slug));
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-bg"
                    >
                      <Wrench size={15} className="text-muted" />
                      <span>{s.name}</span>
                      <span className="text-xs text-muted">{s.professional.companyName}</span>
                    </button>
                  ))}
                </div>
              )}
              {data!.cities.length > 0 && (
                <div>
                  <p className="px-4 pt-1.5 pb-1 text-xs font-semibold uppercase text-muted">Villes</p>
                  {data!.cities.map((c) => (
                    <button key={c} onClick={() => goExplorer(c)} className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-bg">
                      <MapPin size={15} className="text-muted" />
                      <span>{c}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
