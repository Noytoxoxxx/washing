import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { paths } from "../../../lib/paths";

export function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-light">
        <Compass size={30} className="text-primary" />
      </div>
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Cette page n'existe pas.</h1>
      <p className="mt-2 text-sm text-muted">La page que vous recherchez a peut-être été déplacée ou n'existe plus.</p>
      <Link to={paths.home} className="mt-6">
        <Button>Retour à l'accueil</Button>
      </Link>
    </div>
  );
}
