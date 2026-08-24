import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, BadgeCheck, Crown } from "lucide-react";
import { meApi } from "../../api/me";
import { professionalsApi } from "../../api/professionals";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";
import { paths } from "../../lib/paths";
import { useToast } from "../../context/ToastContext";

export function Follows() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["follows"], queryFn: meApi.follows });

  async function unfollow(professionalId: string) {
    await professionalsApi.toggleFollow(professionalId);
    toast.success("Vous ne suivez plus ce professionnel.");
    qc.invalidateQueries({ queryKey: ["follows"] });
  }

  const follows = data?.follows ?? [];

  return (
    <div>
      <PageHeader title="Mes abonnements" description="Les professionnels que vous suivez." />
      {isLoading ? null : follows.length === 0 ? (
        <EmptyState icon={Users} title="Aucun abonnement" description="Suivez des professionnels pour voir leurs publications dans votre fil." action={<Link to={paths.explorer}><Button>Explorer les pros</Button></Link>} />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {follows.map((f) => (
            <li key={f.id} className="flex items-center justify-between px-4 py-3">
              <Link to={paths.professional(f.professional.slug)} className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border border-border bg-bg">
                  {f.professional.logoUrl && <img src={f.professional.logoUrl} alt="" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-ink">{f.professional.companyName}</p>
                    {f.professional.verified && <BadgeCheck size={13} className="text-primary" />}
                    {f.professional.isFounder && <Crown size={13} className="text-warning" />}
                  </div>
                  <p className="text-xs text-muted">{f.professional.city}</p>
                </div>
              </Link>
              <Button size="sm" variant="outline" onClick={() => unfollow(f.professional.id)}>
                Ne plus suivre
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
