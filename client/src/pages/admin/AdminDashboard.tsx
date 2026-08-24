import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Briefcase, Crown, UserPlus, CalendarCheck, FileText, Star, Wallet, Percent } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageLoader } from "../../components/ui/PageLoader";
import { BookingStatusBadge } from "../../components/BookingStatusBadge";
import { paths } from "../../lib/paths";

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary">
        <Icon size={16} />
      </div>
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.dashboard });

  if (isLoading || !data) return <PageLoader />;
  const { kpis, recentBookings, recentProfessionals, recentProspects } = data;

  return (
    <div>
      <PageHeader title="Dashboard admin" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi icon={Users} label="Utilisateurs" value={kpis.totalUsers} />
        <Kpi icon={Briefcase} label="Professionnels" value={kpis.totalProfessionals} />
        <Kpi icon={Crown} label="Founding Partners" value={kpis.totalFounders} />
        <Kpi icon={UserPlus} label="Prospects" value={kpis.totalProspects} />
        <Kpi icon={CalendarCheck} label="Réservations" value={kpis.totalBookings} />
        <Kpi icon={FileText} label="Publications" value={kpis.totalPosts} />
        <Kpi icon={Star} label="Avis" value={kpis.totalReviews} />
        <Kpi icon={Wallet} label="CA total" value={`${kpis.revenue} €`} />
        <Kpi icon={Percent} label="Commissions" value={`${kpis.commissions} €`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Dernières réservations</h2>
            <Link to={paths.adminBookings} className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          {recentBookings.length === 0 ? <p className="text-sm text-muted">Aucune réservation.</p> : (
            <ul className="space-y-2">
              {recentBookings.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-text">{b.professional?.companyName}</span>
                  <BookingStatusBadge status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Nouveaux professionnels</h2>
            <Link to={paths.adminProfessionals} className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          {recentProfessionals.length === 0 ? <p className="text-sm text-muted">Aucun professionnel.</p> : (
            <ul className="space-y-2">
              {recentProfessionals.map((p: any) => (
                <li key={p.id}>
                  <Link to={`${paths.adminProfessionals}/${p.id}`} className="text-sm text-text hover:text-primary">{p.companyName}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-border bg-white p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink">Nouveaux prospects</h2>
            <Link to={paths.adminProspects} className="text-sm font-medium text-primary hover:underline">Voir tout</Link>
          </div>
          {recentProspects.length === 0 ? <p className="text-sm text-muted">Aucun prospect.</p> : (
            <ul className="space-y-2">
              {recentProspects.map((p: any) => (
                <li key={p.id} className="text-sm text-text">{p.businessName}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
