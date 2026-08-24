import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { ApiClientError } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function ProLogin() {
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
      if (user.role !== "PROFESSIONAL") {
        await logout();
        setError("Ce compte n'est pas un compte professionnel.");
        return;
      }
      toast.success("Bienvenue dans votre espace professionnel.");
      navigate(paths.pro);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Espace professionnel"
      subtitle="Connectez-vous à votre compte VEYZA Pro"
      footer={
        <>
          Vous êtes un client ?{" "}
          <Link to={paths.login} className="font-medium text-primary hover:underline">
            Connexion client
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Mot de passe" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-right text-sm">
          <Link to={paths.forgotPassword} className="font-medium text-primary hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={loading}>
          Se connecter
        </Button>
      </form>
    </AuthCard>
  );
}
