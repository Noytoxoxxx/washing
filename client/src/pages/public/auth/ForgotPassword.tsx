import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../../components/layout/AuthCard";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { api } from "../../../api/client";
import { paths } from "../../../lib/paths";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien de réinitialisation"
      footer={
        <Link to={paths.login} className="font-medium text-primary hover:underline">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <p className="rounded-md bg-success/10 px-3 py-3 text-sm text-success">
          Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" fullWidth loading={loading}>
            Envoyer le lien
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
