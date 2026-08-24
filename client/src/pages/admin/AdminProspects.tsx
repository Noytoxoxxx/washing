import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserPlus, Pencil, Trash2, ArrowRightCircle, Copy } from "lucide-react";
import { adminApi } from "../../api/admin";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Switch } from "../../components/ui/Switch";
import { useToast } from "../../context/ToastContext";
import { ApiClientError } from "../../api/client";
import { paths } from "../../lib/paths";

const STATUS_LABELS: Record<string, string> = {
  to_contact: "À contacter",
  contacted: "Contacté",
  replied: "Réponse",
  interested: "Intéressé",
  account_created: "Compte créé",
  onboarding: "Onboarding",
  verified: "Vérifié",
  active: "Actif",
  refused: "Refusé",
};

const STATUS_OPTIONS = [{ value: "", label: "Tous les statuts" }, ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))];

export function AdminProspects() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ businessName: "", contactName: "", phone: "", email: "", city: "", instagram: "", tiktok: "", notes: "", status: "to_contact" });
  const [toDelete, setToDelete] = useState<any>(null);
  const [converting, setConverting] = useState<any>(null);
  const [convertForm, setConvertForm] = useState({ email: "", contactFirstName: "", contactLastName: "", city: "", isFounder: true, verified: false });
  const [convertResult, setConvertResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ["admin-prospects", status], queryFn: () => adminApi.prospects.list({ status }) });
  const prospects = data?.prospects ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ businessName: "", contactName: "", phone: "", email: "", city: "", instagram: "", tiktok: "", notes: "", status: "to_contact" });
    setFormOpen(true);
  }

  function openEdit(p: any) {
    setEditing(p);
    setForm({ businessName: p.businessName, contactName: p.contactName || "", phone: p.phone || "", email: p.email || "", city: p.city || "", instagram: p.instagram || "", tiktok: p.tiktok || "", notes: p.notes || "", status: p.status });
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.businessName) return toast.error("Le nom de l'entreprise est requis.");
    setSaving(true);
    try {
      if (editing) {
        await adminApi.prospects.update(editing.id, form);
        toast.success("Prospect mis à jour.");
      } else {
        await adminApi.prospects.create(form);
        toast.success("Prospect ajouté.");
      }
      setFormOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-prospects"] });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    await adminApi.prospects.remove(toDelete.id);
    toast.success("Prospect supprimé.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["admin-prospects"] });
  }

  function openConvert(p: any) {
    setConverting(p);
    setConvertForm({
      email: p.email || "",
      contactFirstName: p.contactName?.split(" ")[0] || "",
      contactLastName: p.contactName?.split(" ").slice(1).join(" ") || "",
      city: p.city || "",
      isFounder: true,
      verified: false,
    });
  }

  async function handleConvert(e: FormEvent) {
    e.preventDefault();
    if (!converting) return;
    setSaving(true);
    try {
      const res = await adminApi.prospects.convert(converting.id, convertForm);
      setConvertResult(res);
      setConverting(null);
      qc.invalidateQueries({ queryKey: ["admin-prospects"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Prospects" description="CRM de recrutement des professionnels." action={<Button onClick={openCreate}><Plus size={16} /> Nouveau prospect</Button>} />

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>

      {isLoading ? null : prospects.length === 0 ? (
        <EmptyState icon={UserPlus} title="Aucun prospect" description="Ajoutez les professionnels que vous démarchez." action={<Button onClick={openCreate}>Nouveau prospect</Button>} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg text-left text-xs font-semibold uppercase text-muted">
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Réseaux</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {prospects.map((p: any) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3 font-medium text-ink">{p.businessName}</td>
                  <td className="px-4 py-3 text-muted">{p.contactName || "—"}</td>
                  <td className="px-4 py-3 text-muted">{p.city || "—"}</td>
                  <td className="px-4 py-3 text-muted">{[p.instagram, p.tiktok].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="px-4 py-3"><Badge tone={p.status === "active" ? "success" : p.status === "refused" ? "danger" : "primary"}>{STATUS_LABELS[p.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {!p.convertedProfessionalId && (
                        <Button size="sm" variant="outline" onClick={() => openConvert(p)}>
                          <ArrowRightCircle size={14} /> Convertir
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)} aria-label="Modifier"><Pencil size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => setToDelete(p)} aria-label="Supprimer"><Trash2 size={14} className="text-danger" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Modifier le prospect" : "Nouveau prospect"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom de l'entreprise" required value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Contact" value={form.contactName} onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))} />
            <Input label="Téléphone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <Input label="Ville" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Instagram" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} />
            <Input label="TikTok" value={form.tiktok} onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))} />
          </div>
          <Select label="Statut" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button type="submit" loading={saving}>{editing ? "Enregistrer" : "Ajouter"}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!converting} onClose={() => setConverting(null)} title={`Convertir "${converting?.businessName}" en professionnel`} size="md">
        <form onSubmit={handleConvert} className="space-y-4">
          <p className="text-sm text-muted">Les informations du prospect (nom, téléphone, réseaux) sont automatiquement reprises.</p>
          <Input label="Email du compte" type="email" required value={convertForm.email} onChange={(e) => setConvertForm((f) => ({ ...f, email: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom du contact" required value={convertForm.contactFirstName} onChange={(e) => setConvertForm((f) => ({ ...f, contactFirstName: e.target.value }))} />
            <Input label="Nom du contact" required value={convertForm.contactLastName} onChange={(e) => setConvertForm((f) => ({ ...f, contactLastName: e.target.value }))} />
          </div>
          <Input label="Ville" value={convertForm.city} onChange={(e) => setConvertForm((f) => ({ ...f, city: e.target.value }))} />
          <Switch label="Vérifié" checked={convertForm.verified} onChange={(v) => setConvertForm((f) => ({ ...f, verified: v }))} />
          <Switch label="Founding Partner (PRO gratuit à vie)" checked={convertForm.isFounder} onChange={(v) => setConvertForm((f) => ({ ...f, isFounder: v }))} />
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => setConverting(null)}>Annuler</Button>
            <Button type="submit" loading={saving}>Convertir</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer le prospect"
        message={`Voulez-vous vraiment supprimer "${toDelete?.businessName}" ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <Modal open={!!convertResult} onClose={() => setConvertResult(null)} title="Professionnel créé" size="sm">
        {convertResult && (
          <div>
            <p className="text-sm text-muted">{convertResult.professional.companyName} a été converti avec succès.</p>
            <div className="mt-3 space-y-2 rounded-md border border-border bg-bg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Email</span>
                <span className="font-medium text-ink">{convertResult.credentials.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Mot de passe temporaire</span>
                <button onClick={() => { navigator.clipboard.writeText(convertResult.credentials.tempPassword); toast.success("Copié."); }} className="flex items-center gap-1 font-medium text-ink hover:text-primary">
                  {convertResult.credentials.tempPassword} <Copy size={13} />
                </button>
              </div>
            </div>
            <Button fullWidth className="mt-4" onClick={() => navigate(`${paths.adminProfessionals}/${convertResult.professional.id}`)}>
              Voir le profil
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
