import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ArrowRight, ShoppingBag, Compass, CalendarCheck } from "lucide-react";
import { professionalsApi } from "../../api/professionals";
import { categoriesApi } from "../../api/misc";
import { postsApi } from "../../api/posts";
import { ProfessionalCard } from "../../components/ProfessionalCard";
import { CardSkeleton } from "../../components/ui/Skeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { paths } from "../../lib/paths";

export function Home() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: topPros, isLoading: prosLoading } = useQuery({
    queryKey: ["home-pros"],
    queryFn: () => professionalsApi.list({ sort: "rating", limit: 8 }),
  });
  const { data: feed } = useQuery({ queryKey: ["home-feed"], queryFn: () => postsApi.feed({ page: 1 }) });

  const beforeAfterPosts = (feed?.posts ?? []).filter((p) => p.isBeforeAfter).slice(0, 4);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`${paths.explorer}${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <div>
      <section className="bg-gradient-to-b from-primary-light to-bg px-4 py-20 text-center sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">Votre voiture mérite mieux.</h1>
          <p className="mt-4 text-lg text-muted">
            Trouvez et réservez les meilleurs professionnels du car care près de chez vous : lavage, detailing, céramique,
            PPF et plus.
          </p>
          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-lg items-center gap-2 rounded-md border border-border bg-white p-1.5 shadow-card">
            <Search size={18} className="ml-2 shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un professionnel, un service..."
              aria-label="Rechercher"
              className="w-full bg-transparent px-1 py-2 text-sm text-text placeholder:text-muted focus:outline-none"
            />
            <Button type="submit">Rechercher</Button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={paths.explorer}>
              <Button variant="secondary">Explorer les pros</Button>
            </Link>
            <Link to={paths.becomePro}>
              <Button variant="outline">Devenir professionnel</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-xl font-bold text-ink">Que recherchez-vous ?</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {(categories?.categories ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`${paths.explorer}?category=${c.slug}`)}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary"
            >
              {c.name}
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-ink">Les meilleurs près de vous</h2>
          <Link to={paths.explorer} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        {prosLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : topPros && topPros.professionals.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topPros.professionals.map((p) => <ProfessionalCard key={p.id} pro={p} />)}
          </div>
        ) : (
          <EmptyState icon={ShoppingBag} title="Aucun professionnel pour le moment" description="Les premiers professionnels VEYZA arrivent bientôt." />
        )}
      </section>

      {beforeAfterPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <h2 className="mb-5 text-xl font-bold text-ink">🔥 Avant / Après</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {beforeAfterPosts.map((p) => (
              <Link key={p.id} to={paths.discover} className="block overflow-hidden rounded-lg border border-border shadow-card">
                <img src={p.images[0]} alt="" className="h-40 w-full object-cover" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="border-y border-border bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-ink">Comment ça marche ?</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { icon: Compass, title: "1. Trouvez", text: "Explorez les professionnels près de chez vous grâce à la carte et aux filtres." },
              { icon: MapPin, title: "2. Comparez", text: "Consultez les prestations, avis et galeries pour faire le bon choix." },
              { icon: CalendarCheck, title: "3. Réservez", text: "Réservez votre créneau en ligne et suivez votre rendez-vous en temps réel." },
            ].map((s) => (
              <div key={s.title} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
                  <s.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-ink">Vous êtes professionnel ?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Rejoignez le réseau VEYZA et développez votre clientèle. Les premiers inscrits deviennent Founding Partner.
        </p>
        <Link to={paths.becomePro} className="mt-6 inline-block">
          <Button size="lg">Rejoindre VEYZA</Button>
        </Link>
      </section>
    </div>
  );
}
