import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Upload, X, FileText, Loader2 } from "lucide-react";
import { proApi } from "../../api/pro";
import { postsApi } from "../../api/posts";
import { api, ApiClientError } from "../../api/client";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Textarea } from "../../components/ui/Textarea";
import { Input } from "../../components/ui/Input";
import { Switch } from "../../components/ui/Switch";
import { EmptyState } from "../../components/ui/EmptyState";
import { PostCard } from "../../components/social/PostCard";
import { useToast } from "../../context/ToastContext";

export function ProPublications() {
  const toast = useToast();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: profileData } = useQuery({ queryKey: ["pro-me"], queryFn: proApi.me });
  const professionalId = profileData?.profile?.id;

  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed-mine", professionalId],
    queryFn: () => postsApi.feed({ professionalId }),
    enabled: !!professionalId,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ description: "", vehicleTag: "", serviceTag: "", hashtags: "", isBeforeAfter: false });
  const [publishing, setPublishing] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files) {
        const { url } = await api.upload(file);
        urls.push(url);
      }
      setImages((i) => [...i, ...urls]);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Échec de l'envoi d'une image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handlePublish() {
    if (images.length === 0) return toast.error("Ajoutez au moins une image.");
    setPublishing(true);
    try {
      await postsApi.create({ images, ...form });
      toast.success("Publication mise en ligne.");
      setModalOpen(false);
      setImages([]);
      setForm({ description: "", vehicleTag: "", serviceTag: "", hashtags: "", isBeforeAfter: false });
      qc.invalidateQueries({ queryKey: ["feed-mine"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div>
      <PageHeader title="Mes publications" action={<Button onClick={() => setModalOpen(true)}><Plus size={16} /> Nouvelle publication</Button>} />

      {isLoading ? null : !feed || feed.posts.length === 0 ? (
        <EmptyState icon={FileText} title="Aucune publication" description="Partagez vos réalisations pour attirer plus de clients." action={<Button onClick={() => setModalOpen(true)}>Publier</Button>} />
      ) : (
        <div className="mx-auto max-w-lg space-y-5">
          {feed.posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle publication" size="md">
        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-text">Photos</p>
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-md border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setImages((imgs) => imgs.filter((_, idx) => idx !== i))} aria-label="Retirer" className="absolute right-0.5 top-0.5 rounded-full bg-ink/70 p-0.5 text-white">
                    <X size={11} />
                  </button>
                </div>
              ))}
              <button onClick={() => inputRef.current?.click()} className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-border text-muted hover:text-primary">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </button>
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Véhicule" value={form.vehicleTag} onChange={(e) => setForm((f) => ({ ...f, vehicleTag: e.target.value }))} placeholder="Ex. BMW M3" />
            <Input label="Prestation" value={form.serviceTag} onChange={(e) => setForm((f) => ({ ...f, serviceTag: e.target.value }))} placeholder="Ex. Céramique" />
          </div>
          <Input label="Hashtags" value={form.hashtags} onChange={(e) => setForm((f) => ({ ...f, hashtags: e.target.value }))} placeholder="#veyza #detailing" />
          <Switch label="Publication avant / après" checked={form.isBeforeAfter} onChange={(v) => setForm((f) => ({ ...f, isBeforeAfter: v }))} />
          {images.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-text">Aperçu</p>
              <img src={images[0]} alt="" className="max-h-48 rounded-md border border-border object-cover" />
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button loading={publishing} onClick={handlePublish}>Publier</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
