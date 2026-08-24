import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ApiClientError } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) e.lastName = "Le nom est requis.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Adresse email invalide.";
    if (form.password.length < 8) e.password = "8 caractères minimum.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toast.success("Bienvenue sur VEYZA !");
      navigate(paths.home);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Rejoignez le réseau VEYZA"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link to={paths.login} className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" required value={form.firstName} error={errors.firstName} onChange={(e) => set("firstName", e.target.value)} />
          <Input label="Nom" required value={form.lastName} error={errors.lastName} onChange={(e) => set("lastName", e.target.value)} />
        </div>
        <Input label="Email" type="email" required value={form.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <Input label="Téléphone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        <Input
          label="Mot de passe"
          type="password"
          required
          hint="8 caractères minimum"
          value={form.password}
          error={errors.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <Button type="submit" fullWidth loading={loading}>
          Créer mon compte
        </Button>
      </form>
    </AuthCard>
  );
}
