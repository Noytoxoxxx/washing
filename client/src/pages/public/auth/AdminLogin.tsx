import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ApiClientError } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function AdminLogin() {
  const { login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role !== "ADMIN") {
        await logout();
        setError("Ce compte n'est pas un compte administrateur.");
        return;
      }
      toast.success("Connexion administrateur réussie.");
      navigate(paths.admin);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Administration VEYZA" subtitle="Accès réservé à l'équipe VEYZA">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Mot de passe" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" fullWidth loading={loading}>
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
