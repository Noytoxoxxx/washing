import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { paths } from "../../lib/paths";

export function Logo({ to = paths.home }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2 shrink-0">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
        <Sparkles size={18} />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">VEYZA</span>
    </Link>
  );
}
