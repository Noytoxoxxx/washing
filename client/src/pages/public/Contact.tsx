import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { Button } from "../../components/ui/Button";
import { contactApi } from "../../api/misc";
import { ApiClientError } from "../../api/client";

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Le nom est requis.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Adresse email invalide.";
    if (!form.subject.trim()) e.subject = "Le sujet est requis.";
    if (!form.message.trim()) e.message = "Le message est requis.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await contactApi.send(form);
      setSent(true);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light">
          <Mail size={22} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Contactez-nous</h1>
        <p className="mt-1 text-sm text-muted">Une question, une suggestion ? Nous vous répondons rapidement.</p>
      </div>

      {sent ? (
        <div className="rounded-lg border border-success/30 bg-success/5 px-6 py-8 text-center">
          <p className="font-medium text-success">Votre message a bien été envoyé.</p>
          <p className="mt-1 text-sm text-muted">Notre équipe vous répondra dans les meilleurs délais.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-white p-6 shadow-card" noValidate>
          {formError && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>}
          <Input label="Nom" required value={form.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="Email" type="email" required value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
          <Input label="Sujet" required value={form.subject} error={errors.subject} onChange={(e) => set("subject", e.target.value)} />
          <Textarea label="Message" required rows={5} value={form.message} error={errors.message} onChange={(e) => set("message", e.target.value)} />
          <Button type="submit" fullWidth loading={loading}>
            Envoyer
          </Button>
        </form>
      )}
    </div>
  );
}
