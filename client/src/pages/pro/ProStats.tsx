import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, CalendarCheck, Wallet, Percent, Users, Star, FileText, Heart } from "lucide-react";
import { proApi } from "../../api/pro";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { PageLoader } from "../../components/ui/PageLoader";

const PERIODS = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "12m", label: "12 mois" },
  { value: "all", label: "Depuis le début" },
];

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
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

export function ProStats() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading } = useQuery({ queryKey: ["pro-stats", period], queryFn: () => proApi.stats(period) });

  return (
    <div>
      <PageHeader
        title="Statistiques"
        action={<Select value={period} onChange={setPeriod} options={PERIODS} className="w-48" />}
      />
      {isLoading || !data ? (
        <PageLoader />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Stat icon={Eye} label="Vues du profil" value={data.viewCount} />
          <Stat icon={CalendarCheck} label="Réservations" value={data.bookingCount} />
          <Stat icon={Wallet} label="Chiffre d'affaires" value={`${data.revenue} €`} />
          <Stat icon={Percent} label="Commission estimée" value={`${data.commission} €`} />
          <Stat icon={Users} label="Nouveaux clients" value={data.newClients} />
          <Stat icon={Star} label="Note moyenne" value={data.rating || "—"} />
          <Stat icon={FileText} label="Publications" value={data.postCount} />
          <Stat icon={Heart} label="Likes reçus" value={data.likeCount} />
        </div>
      )}
    </div>
  );
}
