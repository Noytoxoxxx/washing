import { FormEvent, useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import type { Vehicle, VehicleInput } from "../api/vehicles";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<VehicleInput>) => Promise<void>;
  initial?: Vehicle | null;
}

export function VehicleFormModal({ open, onClose, onSubmit, initial }: Props) {
  const [form, setForm] = useState<Partial<VehicleInput>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { make: initial.make, model: initial.model, year: initial.year, color: initial.color, mileage: initial.mileage, plate: initial.plate, nickname: initial.nickname, isPrimary: initial.isPrimary, photoUrl: initial.photoUrl }
          : { isPrimary: false }
      );
      setError(null);
    }
  }, [open, initial]);

  function set<K extends keyof VehicleInput>(key: K, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.make || !form.model) {
      setError("La marque et le modèle sont requis.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Modifier le véhicule" : "Ajouter un véhicule"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Marque" required value={form.make || ""} onChange={(e) => set("make", e.target.value)} />
          <Input label="Modèle" required value={form.model || ""} onChange={(e) => set("model", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Année" type="number" value={form.year ?? ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)} />
          <Input label="Couleur" value={form.color || ""} onChange={(e) => set("color", e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Kilométrage" type="number" value={form.mileage ?? ""} onChange={(e) => set("mileage", e.target.value ? Number(e.target.value) : undefined)} />
          <Input label="Immatriculation" value={form.plate || ""} onChange={(e) => set("plate", e.target.value)} />
        </div>
        <Input label="Nom personnalisé (facultatif)" value={form.nickname || ""} onChange={(e) => set("nickname", e.target.value)} placeholder="Ex. La citadine" />
        <label className="flex items-center gap-2 text-sm text-text">
          <input type="checkbox" checked={!!form.isPrimary} onChange={(e) => set("isPrimary", e.target.checked)} className="rounded border-border" />
          Définir comme véhicule principal
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            {initial ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
