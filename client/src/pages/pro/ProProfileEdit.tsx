import { FormEvent, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { proApi } from "../../api/pro";
import { categoriesApi } from "../../api/misc";
import { PageHeader } from "../../components/ui/PageHeader";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Switch } from "../../components/ui/Switch";
import { Button } from "../../components/ui/Button";
import { ImageUploadField } from "../../components/ImageUploadField";
import { useToast } from "../../context/ToastContext";
import { ApiClientError } from "../../api/client";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function ProProfileEdit() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["pro-me"], queryFn: proApi.me });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [form, setForm] = useState<any>(null);
  const [hours, setHours] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        companyName: p.companyName,
        description: p.description,
        logoUrl: p.logoUrl,
        coverUrl: p.coverUrl,
        phone: p.phone || "",
        contactEmail: p.contactEmail || "",
        address: p.address,
        city: p.city,
        postalCode: p.postalCode,
        website: p.website || "",
        instagram: p.instagram || "",
        tiktok: p.tiktok || "",
        homeService: p.homeService,
        serviceRadiusKm: p.serviceRadiusKm,
        categoryId: p.categoryId || "",
      });
      setHours(
        Array.from({ length: 7 }, (_, i) => p.businessHours.find((h: any) => h.dayOfWeek === i) || { dayOfWeek: i, openTime: "09:00", closeTime: "18:00", closed: i === 0 })
      );
    }
  }, [data]);

  function set(key: string, value: any) {
    setForm((f: any) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await proApi.updateProfile(form);
      await qc.invalidateQueries({ queryKey: ["pro-me"] });
      toast.success("Profil enregistré.");
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  async function saveHours() {
    setSavingHours(true);
    try {
      await proApi.updateHours(hours);
      toast.success("Horaires enregistrés.");
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setSavingHours(false);
    }
  }

  if (isLoading || !form) return null;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Mon profil" description="Ces informations sont visibles publiquement sur votre page VEYZA." />

      <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-white p-6 shadow-card">
        <div className="flex flex-wrap gap-4">
          <ImageUploadField label="Logo" aspect="square" value={form.logoUrl} onChange={(url) => set("logoUrl", url)} />
          <div className="flex-1 min-w-[240px]">
            <ImageUploadField label="Photo de couverture" value={form.coverUrl} onChange={(url) => set("coverUrl", url)} />
          </div>
        </div>
        <Input label="Nom de l'entreprise" required value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
        <Select
          label="Catégorie"
          value={form.categoryId}
          onChange={(v) => set("categoryId", v)}
          options={(categories?.categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <Textarea label="Description" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Téléphone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          <Input label="Email de contact" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
        </div>
        <Input label="Adresse" value={form.address} onChange={(e) => set("address", e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Ville" value={form.city} onChange={(e) => set("city", e.target.value)} />
          <Input label="Code postal" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
        </div>
        <Input label="Site web" value={form.website} onChange={(e) => set("website", e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Instagram" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@votrecompte" />
          <Input label="TikTok" value={form.tiktok} onChange={(e) => set("tiktok", e.target.value)} placeholder="@votrecompte" />
        </div>
        <Switch label="Service à domicile" checked={form.homeService} onChange={(v) => set("homeService", v)} />
        {form.homeService && (
          <Input label="Zone d'intervention (km)" type="number" value={form.serviceRadiusKm} onChange={(e) => set("serviceRadiusKm", Number(e.target.value))} />
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="submit" loading={saving}>
            Enregistrer
          </Button>
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 font-semibold text-ink">Horaires d'ouverture</h2>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-24 text-sm text-text">{DAYS[h.dayOfWeek]}</span>
              <label className="flex items-center gap-1.5 text-xs text-muted">
                <input type="checkbox" checked={!h.closed} onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, closed: !e.target.checked } : x)))} />
                Ouvert
              </label>
              {!h.closed && (
                <>
                  <input type="time" value={h.openTime ?? ""} onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, openTime: e.target.value } : x)))} className="rounded-md border border-border px-2 py-1 text-sm" />
                  <input type="time" value={h.closeTime ?? ""} onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, closeTime: e.target.value } : x)))} className="rounded-md border border-border px-2 py-1 text-sm" />
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button loading={savingHours} onClick={saveHours}>
            Enregistrer les horaires
          </Button>
        </div>
      </div>
    </div>
  );
}
