import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { proApi } from "../../api/pro";
import { categoriesApi } from "../../api/misc";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { ImageUploadField } from "../../components/ImageUploadField";
import { useToast } from "../../context/ToastContext";
import { paths } from "../../lib/paths";

const STEPS = ["Informations", "Localisation", "Prestations", "Photos", "Horaires", "Réseaux", "Finalisation"];
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export function ProOnboarding() {
  const toast = useToast();
  const navigate = useNavigate();
  const { data, refetch } = useQuery({ queryKey: ["pro-me"], queryFn: proApi.me });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState({ companyName: "", description: "", logoUrl: "" as string | null, coverUrl: "" as string | null, categoryId: "" });
  const [location, setLocation] = useState({ address: "", city: "", postalCode: "", latitude: "", longitude: "" });
  const [service, setService] = useState({ name: "", price: "", durationMinutes: "60" });
  const [social, setSocial] = useState({ instagram: "", tiktok: "", website: "" });
  const [hours, setHours] = useState(
    Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i, openTime: i === 0 ? null : "09:00", closeTime: i === 0 ? null : "18:00", closed: i === 0 }))
  );

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setInfo({ companyName: p.companyName, description: p.description, logoUrl: p.logoUrl, coverUrl: p.coverUrl, categoryId: p.categoryId || "" });
      setLocation({ address: p.address, city: p.city, postalCode: p.postalCode, latitude: p.latitude ?? "", longitude: p.longitude ?? "" });
      setSocial({ instagram: p.instagram || "", tiktok: p.tiktok || "", website: p.website || "" });
    }
  }, [data]);

  async function saveAndNext() {
    setSaving(true);
    try {
      if (step === 0) {
        await proApi.updateProfile({ ...info, onboardingStep: 2 });
      } else if (step === 1) {
        await proApi.updateProfile({
          address: location.address,
          city: location.city,
          postalCode: location.postalCode,
          latitude: location.latitude ? Number(location.latitude) : undefined,
          longitude: location.longitude ? Number(location.longitude) : undefined,
          onboardingStep: 3,
        });
      } else if (step === 2) {
        if (service.name && service.price) {
          await proApi.createService({ name: service.name, price: Number(service.price), durationMinutes: Number(service.durationMinutes) });
        }
        await proApi.updateProfile({ onboardingStep: 4 });
      } else if (step === 4) {
        await proApi.updateHours(hours as any);
        await proApi.updateProfile({ onboardingStep: 6 });
      } else if (step === 5) {
        await proApi.updateProfile({ ...social, onboardingStep: 7 });
      }
      await refetch();
      setStep((s) => s + 1);
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    navigate(paths.pro);
  }

  const profile = data?.profile;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-bold text-ink">Configurez votre profil VEYZA</h1>
      <p className="mt-1 text-sm text-muted">Complétez ces étapes pour rendre votre profil visible sur VEYZA.</p>

      <div className="my-6 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`} title={s} />
        ))}
      </div>
      <p className="mb-5 text-sm font-semibold text-ink">
        Étape {Math.min(step + 1, STEPS.length)}/{STEPS.length} — {STEPS[Math.min(step, STEPS.length - 1)]}
      </p>

      <div className="rounded-lg border border-border bg-white p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <Input label="Nom de l'entreprise" required value={info.companyName} onChange={(e) => setInfo((f) => ({ ...f, companyName: e.target.value }))} />
            <Select
              label="Catégorie"
              value={info.categoryId}
              onChange={(v) => setInfo((f) => ({ ...f, categoryId: v }))}
              placeholder="Choisir une catégorie"
              options={(categories?.categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
            <Textarea label="Description" rows={4} value={info.description} onChange={(e) => setInfo((f) => ({ ...f, description: e.target.value }))} />
            <div className="flex gap-4">
              <ImageUploadField label="Logo" aspect="square" value={info.logoUrl} onChange={(url) => setInfo((f) => ({ ...f, logoUrl: url }))} />
              <div className="flex-1">
                <ImageUploadField label="Photo de couverture" value={info.coverUrl} onChange={(url) => setInfo((f) => ({ ...f, coverUrl: url }))} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input label="Adresse" value={location.address} onChange={(e) => setLocation((f) => ({ ...f, address: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Ville" value={location.city} onChange={(e) => setLocation((f) => ({ ...f, city: e.target.value }))} />
              <Input label="Code postal" value={location.postalCode} onChange={(e) => setLocation((f) => ({ ...f, postalCode: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Latitude" hint="Ex. 48.8566" value={location.latitude} onChange={(e) => setLocation((f) => ({ ...f, latitude: e.target.value }))} />
              <Input label="Longitude" hint="Ex. 2.3522" value={location.longitude} onChange={(e) => setLocation((f) => ({ ...f, longitude: e.target.value }))} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted">Ajoutez votre première prestation (vous pourrez en ajouter d'autres depuis votre tableau de bord).</p>
            <Input label="Nom de la prestation" value={service.name} onChange={(e) => setService((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prix (€)" type="number" value={service.price} onChange={(e) => setService((f) => ({ ...f, price: e.target.value }))} />
              <Input label="Durée (min)" type="number" value={service.durationMinutes} onChange={(e) => setService((f) => ({ ...f, durationMinutes: e.target.value }))} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <p className="mb-4 text-sm text-muted">Ajoutez des photos depuis la page Galerie de votre tableau de bord après l'onboarding.</p>
            <ImageUploadField
              label="Photo de couverture (si pas encore ajoutée)"
              value={info.coverUrl}
              onChange={async (url) => {
                setInfo((f) => ({ ...f, coverUrl: url }));
                await proApi.updateProfile({ coverUrl: url || undefined });
              }}
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-sm text-text">{DAYS[h.dayOfWeek]}</span>
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={!h.closed}
                    onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, closed: !e.target.checked } : x)))}
                  />
                  Ouvert
                </label>
                {!h.closed && (
                  <>
                    <input
                      type="time"
                      value={h.openTime ?? ""}
                      onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, openTime: e.target.value } : x)))}
                      className="rounded-md border border-border px-2 py-1 text-sm"
                    />
                    <input
                      type="time"
                      value={h.closeTime ?? ""}
                      onChange={(e) => setHours((hs) => hs.map((x, xi) => (xi === i ? { ...x, closeTime: e.target.value } : x)))}
                      className="rounded-md border border-border px-2 py-1 text-sm"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Input label="Instagram" value={social.instagram} onChange={(e) => setSocial((f) => ({ ...f, instagram: e.target.value }))} placeholder="@votrecompte" />
            <Input label="TikTok" value={social.tiktok} onChange={(e) => setSocial((f) => ({ ...f, tiktok: e.target.value }))} placeholder="@votrecompte" />
            <Input label="Site web" value={social.website} onChange={(e) => setSocial((f) => ({ ...f, website: e.target.value }))} />
          </div>
        )}

        {step === 6 && (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={44} className="text-success" />
            <h3 className="mt-3 text-lg font-semibold text-ink">Votre profil est prêt !</h3>
            <p className="mt-1 text-sm text-muted">
              {profile?.status === "active" ? "Votre profil est en ligne sur VEYZA." : "Votre profil est en attente de vérification par l'équipe VEYZA."}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
            Précédent
          </Button>
          {step < STEPS.length - 1 ? (
            <Button loading={saving} onClick={saveAndNext}>
              Continuer
            </Button>
          ) : (
            <Button onClick={finish}>Accéder au tableau de bord</Button>
          )}
        </div>
      </div>
    </div>
  );
}
