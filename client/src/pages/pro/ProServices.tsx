import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Wrench } from "lucide-react";
import { proApi } from "../../api/pro";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Switch } from "../../components/ui/Switch";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useToast } from "../../context/ToastContext";

export function ProServices() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ["pro-services"], queryFn: proApi.services });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", durationMinutes: "60", active: true });
  const [saving, setSaving] = useState(false);

  const services = data?.services ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "", price: "", durationMinutes: "60", active: true });
    setModalOpen(true);
  }

  function openEdit(s: any) {
    setEditing(s);
    setForm({ name: s.name, description: s.description, price: String(s.price), durationMinutes: String(s.durationMinutes), active: s.active });
    setModalOpen(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.price) return toast.error("Le nom et le prix sont requis.");
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, price: Number(form.price), durationMinutes: Number(form.durationMinutes), active: form.active };
      if (editing) {
        await proApi.updateService(editing.id, payload);
        toast.success("Prestation mise à jour.");
      } else {
        await proApi.createService(payload);
        toast.success("Prestation ajoutée.");
      }
      setModalOpen(false);
      qc.invalidateQueries({ queryKey: ["pro-services"] });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    await proApi.removeService(toDelete.id);
    toast.success("Prestation supprimée.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["pro-services"] });
  }

  async function toggleActive(s: any) {
    await proApi.updateService(s.id, { active: !s.active });
    qc.invalidateQueries({ queryKey: ["pro-services"] });
  }

  async function move(index: number, dir: -1 | 1) {
    const arr = [...services];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    await proApi.reorderServices(arr.map((s) => s.id));
    qc.invalidateQueries({ queryKey: ["pro-services"] });
  }

  return (
    <div>
      <PageHeader
        title="Mes prestations"
        action={<Button onClick={openCreate}><Plus size={16} /> Ajouter une prestation</Button>}
      />

      {isLoading ? null : services.length === 0 ? (
        <EmptyState icon={Wrench} title="Aucune prestation" description="Ajoutez votre première prestation pour apparaître dans les recherches." action={<Button onClick={openCreate}>Ajouter une prestation</Button>} />
      ) : (
        <div className="space-y-2">
          {services.map((s: any, i: number) => (
            <div key={s.id} className={`flex items-center justify-between rounded-lg border bg-white p-4 shadow-card ${!s.active ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(i, -1)} aria-label="Monter" className="text-muted hover:text-ink disabled:opacity-30">
                    <ArrowUp size={14} />
                  </button>
                  <button disabled={i === services.length - 1} onClick={() => move(i, 1)} aria-label="Descendre" className="text-muted hover:text-ink disabled:opacity-30">
                    <ArrowDown size={14} />
                  </button>
                </div>
                <div>
                  <p className="font-medium text-ink">{s.name}</p>
                  <p className="text-xs text-muted">{s.durationMinutes} min · {s.price} €</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={s.active} onChange={() => toggleActive(s)} label={s.active ? "Actif" : "Inactif"} />
                <Button size="sm" variant="outline" onClick={() => openEdit(s)} aria-label="Modifier"><Pencil size={14} /></Button>
                <Button size="sm" variant="outline" onClick={() => setToDelete(s)} aria-label="Supprimer"><Trash2 size={14} className="text-danger" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Modifier la prestation" : "Nouvelle prestation"} footer={
        <>
          <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
          <Button loading={saving} onClick={handleSubmit}>{editing ? "Enregistrer" : "Ajouter"}</Button>
        </>
      }>
        <div className="space-y-4">
          <Input label="Nom" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix (€)" type="number" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            <Input label="Durée (min)" type="number" required value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
          </div>
          <Switch label="Prestation active" checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la prestation"
        message={`Voulez-vous vraiment supprimer "${toDelete?.name}" ?`}
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
