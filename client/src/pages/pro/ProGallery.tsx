import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Star, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { proApi } from "../../api/pro";
import { api, ApiClientError } from "../../api/client";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { GalleryLightbox } from "../../components/GalleryLightbox";
import { useToast } from "../../context/ToastContext";

export function ProGallery() {
  const qc = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isLoading } = useQuery({ queryKey: ["pro-gallery"], queryFn: proApi.gallery });
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const images = data?.images ?? [];

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { url } = await api.upload(file);
        await proApi.addGalleryImage({ url });
      }
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} ajoutée${files.length > 1 ? "s" : ""}.`);
      qc.invalidateQueries({ queryKey: ["pro-gallery"] });
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Échec de l'envoi d'une image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    await proApi.removeGalleryImage(toDelete.id);
    toast.success("Image supprimée.");
    setToDelete(null);
    qc.invalidateQueries({ queryKey: ["pro-gallery"] });
  }

  async function setCover(id: string) {
    await proApi.setGalleryCover(id);
    toast.success("Image de couverture mise à jour.");
    qc.invalidateQueries({ queryKey: ["pro-gallery"] });
  }

  return (
    <div>
      <PageHeader
        title="Ma galerie"
        action={
          <Button loading={uploading} onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> Ajouter des photos
          </Button>
        }
      />
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {isLoading ? null : images.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Aucune photo" description="Ajoutez vos plus belles réalisations pour attirer plus de clients." action={<Button onClick={() => inputRef.current?.click()}>Ajouter des photos</Button>} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {uploading && (
            <div className="flex aspect-square items-center justify-center rounded-md border border-dashed border-border bg-bg">
              <Loader2 size={22} className="animate-spin text-muted" />
            </div>
          )}
          {images.map((img: any, i: number) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-md border border-border">
              <button onClick={() => setLightboxIndex(i)} className="h-full w-full">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
              {img.isCover && <span className="absolute left-1.5 top-1.5 rounded-sm bg-ink px-1.5 py-0.5 text-[10px] font-medium text-white">Couverture</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {!img.isCover && (
                  <button onClick={() => setCover(img.id)} aria-label="Définir comme couverture" className="rounded-full bg-white/90 p-1.5">
                    <Star size={13} />
                  </button>
                )}
                <button onClick={() => setToDelete(img)} aria-label="Supprimer" className="rounded-full bg-white/90 p-1.5">
                  <Trash2 size={13} className="text-danger" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer l'image"
        message="Cette image sera définitivement supprimée de votre galerie."
        confirmLabel="Supprimer"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      {lightboxIndex !== null && (
        <GalleryLightbox images={images} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}
    </div>
  );
}
