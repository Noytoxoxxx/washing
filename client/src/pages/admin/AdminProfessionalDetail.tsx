import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Crown, ExternalLink, Copy, CheckSquare, Square } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Switch } from "../../components/ui/Switch";
import { PageLoader } from "../../components/ui/PageLoader";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Modal } from "../../components/ui/Modal";
import { paths } from "../../lib/paths";
import { useToast } from "../../context/ToastContext";

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "business", label: "Business" },
  { value: "founder", label: "Founder" },
];

export function AdminProfessionalDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["admin-professional", id], queryFn: () => adminApi.professionals.get(id) });
  const [toDelete, setToDelete] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  if (isLoading || !data) return <PageLoader />;
  const p = data.professional;

  function refresh() {
    qc.invalidateQueries({ queryKey: ["admin-professional", id] });
    qc.invalidateQueries({ queryKey: ["admin-professionals"] });
  }

  async function setStatus(status: string) {
    await adminApi.professionals.setStatus(id, status);
    toast.success("Statut mis à jour.");
    refresh();
  }

  async function toggleVerify() {
    await adminApi.professionals.setVerified(id, !p.verified);
    toast.success(!p.verified ? "Professionnel vérifié." : "Vérification retirée.");
    refresh();
  }

  async function toggleFounder() {
    await adminApi.professionals.setFounder(id, !p.isFounder);
    toast.success(!p.isFounder ? "Statut Founding Partner attribué." : "Statut Founding Partner retiré.");
    refresh();
  }

  async function changePlan(plan: string) {
    await adminApi.professionals.setPlan(id, plan);
    toast.success("Plan mis à jour.");
    refresh();
  }

  async function resetAccess() {
    const res = await adminApi.professionals.resetAccess(id);
    setResetResult(res.tempPassword);
  }

  async function handleDelete() {
    await adminApi.professionals.remove(id);
    toast.success("Professionnel supprimé.");
    navigate(paths.adminProfessionals);
  }

  const checklist = [
    { label: "Compte créé", done: true },
    { label: "Profil complété", done: p.profileCompletion >= 60 },
    { label: "Prestations", done: p.services.length > 0 },
    { label: "Photos", done: p.galleryImages.length > 0 },
    { label: "Horaires", done: p.businessHours.length > 0 },
    { label: "Vérifié", done: p.verified },
    { label: "Public", done: p.status === "active" },
  ];

  return (
    <div>
      <PageHeader
        title={p.companyName}
        description={p.user.email}
        action={
          <div className="flex gap-2">
            <Link to={paths.professional(p.slug)} target="_blank">
              <Button variant="outline"><ExternalLink size={14} /> Voir le profil public</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={p.status === "active" ? "success" : p.status === "suspended" ? "danger" : "neutral"}>{p.status}</Badge>
        {p.verified && <Badge tone="primary" icon={<BadgeCheck size={12} />}>Vérifié</Badge>}
        {p.isFounder && <Badge tone="founder" icon={<Crown size={12} />}>Founding Partner</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-ink">Checklist d'onboarding ({p.profileCompletion}%)</h2>
            <ul className="space-y-2">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-sm">
                  {c.done ? <CheckSquare size={16} className="text-success" /> : <Square size={16} className="text-muted" />}
                  <span className={c.done ? "text-ink" : "text-muted"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-ink">Informations</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted">Ville</dt><dd className="text-ink">{p.city || "—"}</dd></div>
              <div><dt className="text-muted">Téléphone</dt><dd className="text-ink">{p.phone || "—"}</dd></div>
              <div><dt className="text-muted">Catégorie</dt><dd className="text-ink">{p.category?.name || "—"}</dd></div>
              <div><dt className="text-muted">Inscrit le</dt><dd className="text-ink">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</dd></div>
              <div><dt className="text-muted">Prestations</dt><dd className="text-ink">{p.services.length}</dd></div>
              <div><dt className="text-muted">Réservations</dt><dd className="text-ink">{p.bookings.length}</dd></div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-ink">Statut</h2>
            <Select value={p.status} onChange={setStatus} options={[
              { value: "pending", label: "En attente" },
              { value: "active", label: "Actif" },
              { value: "suspended", label: "Suspendu" },
              { value: "inactive", label: "Inactif" },
            ]} />
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-card space-y-3">
            <h2 className="font-semibold text-ink">Programme & vérification</h2>
            <Switch label="Vérifié" checked={p.verified} onChange={toggleVerify} />
            <Switch label="Founding Partner" checked={p.isFounder} onChange={toggleFounder} />
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-card">
            <h2 className="mb-3 font-semibold text-ink">Plan d'abonnement</h2>
            <Select value={p.subscriptionPlan} onChange={changePlan} options={PLANS} />
            {p.isFounder && <p className="mt-2 text-xs text-muted">Un Founding Partner reste toujours sur le plan Founder.</p>}
          </div>

          <div className="rounded-lg border border-border bg-white p-5 shadow-card space-y-2">
            <h2 className="mb-1 font-semibold text-ink">Accès</h2>
            <Button variant="outline" fullWidth onClick={resetAccess}>Réinitialiser l'accès</Button>
            <Button variant="danger" fullWidth onClick={() => setToDelete(true)}>Supprimer le professionnel</Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={toDelete}
        title="Supprimer le professionnel"
        message={`Voulez-vous vraiment supprimer "${p.companyName}" ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(false)}
      />

      <Modal open={!!resetResult} onClose={() => setResetResult(null)} title="Accès réinitialisé" size="sm">
        <p className="text-sm text-muted">Communiquez ce nouveau mot de passe temporaire au professionnel.</p>
        <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-bg p-3 text-sm">
          <span className="font-mono font-medium text-ink">{resetResult}</span>
          <button onClick={() => { navigator.clipboard.writeText(resetResult || ""); toast.success("Copié."); }} className="text-primary">
            <Copy size={15} />
          </button>
        </div>
      </Modal>
    </div>
  );
}
