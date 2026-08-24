import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Shield, Wallet } from "lucide-react";
import { proApi } from "../../api/pro";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../context/ToastContext";
import { api, ApiClientError } from "../../api/client";

export function ProSettings() {
  const toast = useToast();
  const { data: plan } = useQuery({ queryKey: ["pro-plan"], queryFn: proApi.plan });

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwdError(null);
    if (pwd.newPassword.length < 8) return setPwdError("8 caractères minimum.");
    if (pwd.newPassword !== pwd.confirm) return setPwdError("Les mots de passe ne correspondent pas.");
    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success("Mot de passe modifié.");
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      setPwdError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Paramètres" description="Abonnement, commission et sécurité de votre compte." />

      <section className="mb-8 rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><Wallet size={18} /> Abonnement & commission</h2>
        {plan && (
          <div>
            {plan.isFounder && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-white">
                <Crown size={18} />
                <div>
                  <p className="text-sm font-semibold">🏆 Founding Partner</p>
                  <p className="text-xs text-white/70">Votre statut Founding Partner est permanent.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted">Plan</p>
                <p className="font-semibold text-ink">{plan.label}</p>
              </div>
              <div>
                <p className="text-muted">Prix mensuel</p>
                <p className="font-semibold text-ink">{plan.priceMonthly} €/mois</p>
              </div>
              <div>
                <p className="text-muted">Commission</p>
                <p className="font-semibold text-ink">{plan.ratePercent} %</p>
              </div>
            </div>
            {plan.founderSince && <p className="mt-3 text-xs text-muted">Founding Partner depuis le {new Date(plan.founderSince).toLocaleDateString("fr-FR")}</p>}
            {!plan.isFounder && (
              <p className="mt-4 text-xs text-muted">La gestion des abonnements en libre-service arrive dans une prochaine version. Contactez l'équipe VEYZA pour changer de plan.</p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink"><Shield size={18} /> Sécurité</h2>
        <form onSubmit={savePassword} className="space-y-4">
          {pwdError && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{pwdError}</p>}
          <Input label="Mot de passe actuel" type="password" value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
          <Input label="Nouveau mot de passe" type="password" hint="8 caractères minimum" value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} />
          <Input label="Confirmer le mot de passe" type="password" value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} />
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>Modifier le mot de passe</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
