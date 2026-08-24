import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { api, ApiClientError } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("8 caractères minimum.");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      navigate(`${paths.login}?reset=1`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthCard title="Lien invalide" subtitle="Ce lien de réinitialisation est incomplet ou expiré.">
        <Link to={paths.forgotPassword} className="text-sm font-medium text-primary hover:underline">
          Demander un nouveau lien
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Réinitialiser le mot de passe" subtitle="Choisissez un nouveau mot de passe">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <Input label="Nouveau mot de passe" type="password" required hint="8 caractères minimum" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Input label="Confirmer le mot de passe" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <Button type="submit" fullWidth loading={loading}>
          Réinitialiser
        </Button>
      </form>
    </AuthCard>
  );
}
