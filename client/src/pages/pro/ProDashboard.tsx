import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CalendarCheck, Eye, Star, Users, Heart, FileText, Wallet, ArrowRight, Crown } from "lucide-react";
import { proApi } from "../../api/pro";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../../components/ui/PageLoader";
import { Badge } from "../../components/ui/Badge";
import { paths } from "../../lib/paths";

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary">
        <Icon size={16} />
      </div>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function ProDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["pro-dashboard"], queryFn: proApi.dashboard });

  if (isLoading || !data) return <PageLoader />;
  const { profile, kpis, recentBookings, nextBooking } = data;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Bonjour {user?.firstName}</h1>
          {profile.isFounder && (
            <Badge tone="founder" icon={<Crown size={12} />}>Founding Partner</Badge>
          )}
        </div>
        {profile.status !== "active" && (
          <Badge tone="warning">{profile.status === "pending" ? "En attente de vérification" : profile.status}</Badge>
        )}
      </div>

      {kpis.profileCompletion < 100 && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary-light p-4">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-ink">Profil complété à {kpis.profileCompletion}%</p>
            <Link to={paths.proProfile} className="flex items-center gap-1 font-medium text-primary hover:underline">
              Compléter <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
            <div className="h-full bg-primary" style={{ width: `${kpis.profileCompletion}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={CalendarCheck} label="Réservations" value={kpis.totalBookings} />
        <Kpi icon={Wallet} label="Chiffre d'affaires" value={`${kpis.revenue} €`} />
        <Kpi icon={Eye} label="Vues du profil" value={kpis.viewCount} />
        <Kpi icon={Star} label="Note moyenne" value={kpis.rating || "—"} />
        <Kpi icon={Users} label="Abonnés" value={kpis.followerCount} />
        <Kpi icon={Heart} label="Favoris" value={kpis.favoriteCount} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-5 shadow-card">
          <h2 className="mb-3 font-semibold text-ink">Prochain rendez-vous</h2>
          {nextBooking ? (
            <div>
              <p className="text-sm font-medium text-ink">{nextBooking.service?.name}</p>
              <p className="text-sm text-muted">{new Date(nextBooking.date).toLocaleDateString("fr-FR")} à {nextBooking.timeSlot}</p>
              <p className="mt-1 text-xs text-muted">{nextBooking.client?.firstName} {nextBooking.client?.lastName}</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Aucun rendez-vous à venir.</p>
          )}
          <Link to={paths.proCalendar} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Voir le calendrier <ArrowRight size={13} />
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Réservations récentes</h2>
            <Link to={paths.proBookings} className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-muted">Aucune réservation pour le moment.</p>
          ) : (
            <ul className="space-y-2">
              {recentBookings.map((b: any) => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span className="text-text">{b.service?.name}</span>
                  <span className="text-muted">{new Date(b.date).toLocaleDateString("fr-FR")}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to={paths.proServices}><Badge tone="primary" icon={<FileText size={12} />}>Gérer mes prestations</Badge></Link>
        <Link to={paths.proGallery}><Badge tone="primary">Gérer ma galerie</Badge></Link>
        <Link to={paths.proPosts}><Badge tone="primary">Publier</Badge></Link>
      </div>
    </div>
  );
}
