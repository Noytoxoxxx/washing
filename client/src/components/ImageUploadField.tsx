import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { api, ApiClientError } from "../api/client";
import { useToast } from "../context/ToastContext";

interface Props {
  label?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  aspect?: "square" | "wide";
}

export function ImageUploadField({ label, value, onChange, aspect = "wide" }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("L'image dépasse la taille maximale de 8 Mo.");
      return;
    }
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Échec de l'envoi de l'image.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-text">{label}</p>}
      <div className={`relative overflow-hidden rounded-md border border-dashed border-border bg-bg ${aspect === "square" ? "aspect-square w-32" : "aspect-[3/1] w-full"}`}>
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label="Supprimer l'image"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-white"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted hover:text-primary">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
            <span className="text-xs">{uploading ? "Envoi..." : "Ajouter une image"}</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value && (
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-1.5 text-xs font-medium text-primary hover:underline">
          Remplacer
        </button>
      )}
    </div>
  );
}
