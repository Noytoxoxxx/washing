import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
}
