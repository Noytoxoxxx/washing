import { Phone, Mail, Instagram, Music2, Globe } from "lucide-react";
import { Modal } from "./ui/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  professional: { companyName: string; phone?: string | null; contactEmail?: string | null; instagram?: string | null; tiktok?: string | null; website?: string | null };
}

export function ContactProfessionalModal({ open, onClose, professional }: Props) {
  const rows = [
    professional.phone && { icon: Phone, label: professional.phone, href: `tel:${professional.phone}` },
    professional.contactEmail && { icon: Mail, label: professional.contactEmail, href: `mailto:${professional.contactEmail}` },
    professional.instagram && { icon: Instagram, label: `@${professional.instagram.replace(/^@/, "")}`, href: `https://instagram.com/${professional.instagram.replace(/^@/, "")}` },
    professional.tiktok && { icon: Music2, label: `@${professional.tiktok.replace(/^@/, "")}`, href: `https://tiktok.com/@${professional.tiktok.replace(/^@/, "")}` },
    professional.website && { icon: Globe, label: professional.website, href: professional.website },
  ].filter(Boolean) as { icon: any; label: string; href: string }[];

  return (
    <Modal open={open} onClose={onClose} title={`Contacter ${professional.companyName}`} size="sm">
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Aucune coordonnée disponible pour ce professionnel.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label}>
              <a
                href={r.href}
                target={r.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-center gap-3 rounded-md border border-border p-3 text-sm text-text hover:bg-bg"
              >
                <r.icon size={17} className="text-primary" />
                {r.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
