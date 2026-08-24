import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { paths } from "../../../lib/paths";

export function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <ShieldAlert size={30} className="text-danger" />
      </div>
      <p className="text-sm font-semibold text-danger">403</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Vous n'avez pas accès à cette page.</h1>
      <p className="mt-2 text-sm text-muted">Votre compte ne dispose pas des permissions nécessaires.</p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Link to={paths.home}>
          <Button>Accueil</Button>
        </Link>
      </div>
    </div>
  );
}
