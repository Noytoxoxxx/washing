import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  BadgeCheck,
  Crown,
  Star,
  Share2,
  Heart,
  UserPlus,
  UserCheck,
  Phone,
  Clock,
  Instagram,
  Music2,
  Globe,
} from "lucide-react";
import { professionalsApi } from "../../api/professionals";
import { reviewsApi } from "../../api/bookings";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { StarRating } from "../../components/ui/StarRating";
import { PageLoader } from "../../components/ui/PageLoader";
import { EmptyState } from "../../components/ui/EmptyState";
import { GalleryLightbox } from "../../components/GalleryLightbox";
import { BookingModal } from "../../components/booking/BookingModal";
import { ContactProfessionalModal } from "../../components/ContactProfessionalModal";
import { Select } from "../../components/ui/Select";
import { MessageSquare } from "lucide-react";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function ProfessionalProfile() {
  const { slug = "" } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["professional", slug], queryFn: () => professionalsApi.get(slug) });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [bookingService, setBookingService] = useState<string | null>(null);
  const [reviewSort, setReviewSort] = useState("recent");

  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", data?.professional?.id, reviewSort],
    queryFn: () => reviewsApi.forProfessional(data!.professional.id, reviewSort),
    enabled: !!data?.professional?.id,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return <EmptyState icon={MapPin} title="Professionnel introuvable" description="Ce profil n'existe pas ou n'est plus disponible." />;

  const { professional: p, isFavorite, isFollowing } = data;

  async function toggleFavorite() {
    if (!user) return toast.info("Connectez-vous pour ajouter aux favoris.");
    const res = await professionalsApi.toggleFavorite(p.id);
    toast.success(res.favorited ? "Ajouté aux favoris." : "Retiré des favoris.");
    qc.invalidateQueries({ queryKey: ["professional", slug] });
  }

  async function toggleFollow() {
    if (!user) return toast.info("Connectez-vous pour suivre ce professionnel.");
    const res = await professionalsApi.toggleFollow(p.id);
    toast.success(res.following ? "Vous suivez ce professionnel." : "Vous ne suivez plus ce professionnel.");
    qc.invalidateQueries({ queryKey: ["professional", slug] });
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: p.companyName, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papiers.");
    }
  }

  function openBooking(serviceId?: string) {
    if (!user) return toast.info("Connectez-vous pour réserver une prestation.");
    if (user.role !== "CLIENT") return toast.warning("Seuls les comptes clients peuvent réserver une prestation.");
    setBookingService(serviceId ?? null);
    setBookingOpen(true);
  }

  const galleryImages = p.galleryImages.map((g: any) => ({ url: g.url, pairUrl: g.pairUrl, isBeforeAfter: g.isBeforeAfter }));

  return (
    <div>
      <div className="relative h-56 w-full bg-bg sm:h-72">
        {p.coverUrl && <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border-4 border-white bg-white shadow-card">
              {p.logoUrl && <img src={p.logoUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold text-ink">{p.companyName}</h1>
                {p.verified && <BadgeCheck size={20} className="text-primary" />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                <span className="flex items-center gap-1"><MapPin size={13} /> {p.city}</span>
                <span className="flex items-center gap-1"><Star size={13} className="fill-warning text-warning" /> {p.rating || "—"} ({p.reviews.length} avis)</span>
                <span className={p.openNow ? "text-success" : "text-danger"}>{p.openNow ? "Ouvert maintenant" : "Fermé"}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pb-1">
            {p.isFounder && <Badge tone="founder" icon={<Crown size={12} />}>Founding Partner</Badge>}
            {p.category && <Badge>{p.category.name}</Badge>}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => openBooking()}>Réserver</Button>
          <Button variant="outline" onClick={() => setContactOpen(true)}>
            <Phone size={15} /> Contacter
          </Button>
          <Button variant="outline" onClick={handleShare}>
            <Share2 size={15} /> Partager
          </Button>
          <Button variant={isFavorite ? "secondary" : "outline"} onClick={toggleFavorite}>
            <Heart size={15} className={isFavorite ? "fill-white" : ""} /> {isFavorite ? "Favori" : "Favoris"}
          </Button>
          <Button variant={isFollowing ? "secondary" : "outline"} onClick={toggleFollow}>
            {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />} {isFollowing ? "Abonné" : "Suivre"}
          </Button>
        </div>

        {p.description && <p className="mt-6 max-w-3xl text-sm leading-relaxed text-text">{p.description}</p>}

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {p.instagram && (
            <a href={`https://instagram.com/${p.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted hover:text-primary">
              <Instagram size={15} /> {p.instagram}
            </a>
          )}
          {p.tiktok && (
            <a href={`https://tiktok.com/@${p.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted hover:text-primary">
              <Music2 size={15} /> {p.tiktok}
            </a>
          )}
          {p.website && (
            <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-muted hover:text-primary">
              <Globe size={15} /> Site web
            </a>
          )}
        </div>

        {/* Services */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-ink">Prestations</h2>
          {p.services.length === 0 ? (
            <p className="text-sm text-muted">Aucune prestation publiée pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {p.services.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-4 shadow-card">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{s.name}</p>
                    {s.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{s.description}</p>}
                    <p className="mt-1 text-xs text-muted">{s.durationMinutes} min</p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="font-semibold text-ink">{s.price} €</p>
                    <Button size="sm" className="mt-1.5" onClick={() => openBooking(s.id)}>
                      Réserver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gallery */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-ink">Galerie</h2>
          {galleryImages.length === 0 ? (
            <p className="text-sm text-muted">Aucune photo pour le moment.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {galleryImages.map((img: { url: string }, i: number) => (
                <button key={i} onClick={() => setLightboxIndex(i)} className="aspect-square overflow-hidden rounded-md bg-bg">
                  <img src={img.url} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Hours */}
        <section className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
              <Clock size={18} /> Horaires
            </h2>
            <ul className="divide-y divide-border rounded-lg border border-border bg-white">
              {DAYS.map((day, i) => {
                const h = p.businessHours.find((bh: any) => bh.dayOfWeek === i);
                return (
                  <li key={day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-text">{day}</span>
                    <span className={h && !h.closed ? "text-ink" : "text-muted"}>
                      {h && !h.closed && h.openTime && h.closeTime ? `${h.openTime} – ${h.closeTime}` : "Fermé"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Reviews */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <MessageSquare size={18} /> Avis ({p.reviews.length})
              </h2>
              <Select
                value={reviewSort}
                onChange={setReviewSort}
                options={[
                  { value: "recent", label: "Plus récents" },
                  { value: "highest", label: "Meilleure note" },
                  { value: "lowest", label: "Moins bonne note" },
                ]}
                className="w-44"
              />
            </div>
            {(reviewsData?.reviews ?? p.reviews).length === 0 ? (
              <p className="text-sm text-muted">Aucun avis pour le moment.</p>
            ) : (
              <ul className="space-y-3">
                {(reviewsData?.reviews ?? p.reviews).map((r: any) => (
                  <li key={r.id} className="rounded-lg border border-border bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">{r.client.firstName} {r.client.lastName[0]}.</p>
                      <StarRating value={r.rating} readOnly size={14} />
                    </div>
                    {r.text && <p className="mt-2 text-sm text-text">{r.text}</p>}
                    <p className="mt-1 text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {lightboxIndex !== null && (
        <GalleryLightbox images={galleryImages} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        professionalId={p.id}
        professionalName={p.companyName}
        services={p.services}
        businessHours={p.businessHours}
        defaultServiceId={bookingService}
      />
      <ContactProfessionalModal open={contactOpen} onClose={() => setContactOpen(false)} professional={p} />
    </div>
  );
}
