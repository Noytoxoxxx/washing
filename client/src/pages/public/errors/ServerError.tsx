import { AlertOctagon } from "lucide-react";
import { Button } from "../../../components/ui/Button";

export function ServerError() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger/10">
        <AlertOctagon size={30} className="text-danger" />
      </div>
      <p className="text-sm font-semibold text-danger">500</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Une erreur est survenue.</h1>
      <p className="mt-2 text-sm text-muted">Nos équipes ont été notifiées. Merci de réessayer dans quelques instants.</p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        Réessayer
      </Button>
    </div>
  );
}
