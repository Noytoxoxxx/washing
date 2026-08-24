import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { createPortal } from "react-dom";

interface Props {
  images: { url: string; pairUrl?: string | null; isBeforeAfter?: boolean }[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function GalleryLightbox({ images, index, onClose, onIndexChange }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, images.length, onClose, onIndexChange]);

  const current = images[index];
  if (!current) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm">{index + 1} / {images.length}</span>
        <button onClick={onClose} aria-label="Fermer" className="text-white hover:text-white/70">
          <X size={24} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
        <button
          onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
          aria-label="Image précédente"
          className="absolute left-2 sm:left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronLeft size={22} />
        </button>
        {current.isBeforeAfter && current.pairUrl ? (
          <div className="grid max-h-full max-w-full grid-cols-2 gap-2">
            <div>
              <img src={current.url} alt="Avant" className="max-h-[75vh] rounded-md object-contain" />
              <p className="mt-1 text-center text-xs text-white/70">Avant</p>
            </div>
            <div>
              <img src={current.pairUrl} alt="Après" className="max-h-[75vh] rounded-md object-contain" />
              <p className="mt-1 text-center text-xs text-white/70">Après</p>
            </div>
          </div>
        ) : (
          <img src={current.url} alt="" className="max-h-[80vh] max-w-full rounded-md object-contain" />
        )}
        <button
          onClick={() => onIndexChange((index + 1) % images.length)}
          aria-label="Image suivante"
          className="absolute right-2 sm:right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>,
    document.body
  );
}
