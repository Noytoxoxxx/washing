import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageLoader } from "../../components/ui/PageLoader";
import { useToast } from "../../context/ToastContext";
import { ApiClientError } from "../../api/client";

export function AdminSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-plans"], queryFn: adminApi.settings.plans });
  const [drafts, setDrafts] = useState<Record<string, { ratePercent: string; priceMonthly: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  function draftFor(plan: any) {
    return drafts[plan.plan] ?? { ratePercent: String(plan.ratePercent), priceMonthly: String(plan.priceMonthly) };
  }

  function setDraft(planKey: string, patch: Partial<{ ratePercent: string; priceMonthly: string }>) {
    setDrafts((d) => ({ ...d, [planKey]: { ...draftFor({ plan: planKey, ratePercent: 0, priceMonthly: 0 }), ...d[planKey], ...patch } }));
  }

  async function save(plan: any) {
    const draft = draftFor(plan);
    setSaving(plan.plan);
    try {
      await adminApi.settings.updatePlan(plan.plan, { ratePercent: Number(draft.ratePercent), priceMonthly: Number(draft.priceMonthly) });
      toast.success("Configuration enregistrée.");
      qc.invalidateQueries({ queryKey: ["admin-plans"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(null);
    }
  }

  if (isLoading || !data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="Paramètres" description="Configuration des plans d'abonnement et des taux de commission." />
      <div className="grid gap-5 sm:grid-cols-2">
        {data.plans.map((plan: any) => {
          const draft = draftFor(plan);
          const isFounder = plan.plan === "founder";
          return (
            <div key={plan.plan} className="rounded-lg border border-border bg-white p-5 shadow-card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-semibold text-ink">
                  {isFounder && <Crown size={15} className="text-warning" />} {plan.label}
                </h2>
                <Badge>{plan.accountCount} compte{plan.accountCount > 1 ? "s" : ""}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Commission (%)"
                  type="number"
                  step="0.1"
                  value={draft.ratePercent}
                  onChange={(e) => setDraft(plan.plan, { ratePercent: e.target.value })}
                />
                <Input
                  label="Prix mensuel (€)"
                  type="number"
                  disabled={isFounder}
                  value={draft.priceMonthly}
                  onChange={(e) => setDraft(plan.plan, { priceMonthly: e.target.value })}
                  hint={isFounder ? "Toujours gratuit — règle produit permanente." : undefined}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <Button size="sm" loading={saving === plan.plan} onClick={() => save(plan)}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
