import { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-muted">Dernière mise à jour : {updated}</p>
      <div className="prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-text [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-ink">
        {children}
      </div>
    </div>
  );
}
