import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Copy, ExternalLink, CheckCircle2 } from "lucide-react";
import { adminApi } from "../../api/admin";
import { categoriesApi } from "../../api/misc";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { ImageUploadField } from "../../components/ImageUploadField";
import { useToast } from "../../context/ToastContext";
import { ApiClientError } from "../../api/client";
import { paths } from "../../lib/paths";

export function AdminProfessionalCreate() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [form, setForm] = useState({
    companyName: "",
    contactFirstName: "",
    contactLastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    postalCode: "",
    categoryId: "",
    description: "",
    instagram: "",
    tiktok: "",
    website: "",
    logoUrl: null as string | null,
    coverUrl: null as string | null,
    verified: false,
    isFounder: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ professional: any; credentials: { email: string; tempPassword: string } } | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.companyName || !form.contactFirstName || !form.contactLastName || !form.email) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminApi.professionals.create(form);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié.`);
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Nouveau professionnel" description="Créez manuellement l'accès d'un professionnel recruté." />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-white p-6 shadow-card">
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex gap-4">
          <ImageUploadField label="Logo" aspect="square" value={form.logoUrl} onChange={(url) => set("logoUrl", url)} />
          <div className="flex-1"><ImageUploadField label="Couverture" value={form.coverUrl} onChange={(url) => set("coverUrl", url)} /></div>
        </div>

        <Input label="Nom de l'entreprise" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom du contact" required value={form.contactFirstName} onChange={(e) => set("contactFirstName", e.target.value)} />
          <Input label="Nom du contact" required value={form.contactLastName} onChange={(e) => set("contactLastName", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Téléphone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Ville" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input label="Code postal" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
        <Input label="Adresse" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <Select
          label="Catégorie"
          value={form.categoryId}
          onChange={(v) => set("categoryId", v)}
          options={(categories?.categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Textarea label="Description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Instagram" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          <Input label="TikTok" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} />
        </div>
        <Input label="Site web" value={form.website} onChange={(e) => set("website", e.target.value)} />

        <div className="space-y-3 border-t border-border pt-4">
          <Switch label="Vérifié" checked={form.verified} onChange={(v) => set("verified", v)} />
          <Switch label="Founding Partner (PRO gratuit à vie)" checked={form.isFounder} onChange={(v) => set("isFounder", v)} />
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(paths.adminProfessionals)}>Annuler</Button>
          <Button type="submit" loading={saving}>Créer</Button>
        </div>
      </form>

      <Modal open={!!result} onClose={() => navigate(`${paths.adminProfessionals}/${result?.professional.id}`)} title="Professionnel créé" size="sm">
        {result && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-success">
              <CheckCircle2 size={20} />
              <p className="text-sm font-medium">{result.professional.companyName} a bien été créé.</p>
            </div>
            <div className="space-y-2 rounded-md border border-border bg-bg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Email</span>
                <button onClick={() => copy(result.credentials.email, "Email")} className="flex items-center gap-1 font-medium text-ink hover:text-primary">
                  {result.credentials.email} <Copy size={13} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Mot de passe temporaire</span>
                <button onClick={() => copy(result.credentials.tempPassword, "Mot de passe")} className="flex items-center gap-1 font-medium text-ink hover:text-primary">
                  {result.credentials.tempPassword} <Copy size={13} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" onClick={() => copy(`${window.location.origin}${paths.proLogin}`, "Lien d'activation")}>
                <Copy size={14} /> Copier le lien d'activation
              </Button>
              <Button variant="outline" onClick={() => navigate(`${paths.adminProfessionals}/${result.professional.id}`)}>
                <ExternalLink size={14} /> Voir le profil
              </Button>
              <Button onClick={() => navigate(paths.adminProfessionals)}>Terminer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
