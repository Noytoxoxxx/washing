import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ApiClientError } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password, remember);
      toast.success("Connexion réussie. Bon retour !");
      const next = params.get("next");
      if (next) navigate(next);
      else if (user.role === "PROFESSIONAL") navigate(paths.pro);
      else if (user.role === "ADMIN") navigate(paths.admin);
      else navigate(paths.home);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Connexion"
      subtitle="Accédez à votre compte VEYZA"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link to={paths.register} className="font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Mot de passe" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded border-border" />
            Se souvenir de moi
          </label>
          <Link to={paths.forgotPassword} className="font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          Se connecter
        </Button>
      </form>
      <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted">
        Vous êtes professionnel ?{" "}
        <Link to={paths.proLogin} className="font-medium text-primary hover:underline">
          Connexion pro
        </Link>
      </div>
    </AuthCard>
  );
}
