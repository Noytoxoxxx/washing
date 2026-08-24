import { Link } from "react-router-dom";
import { Instagram, Music2 } from "lucide-react";
import { Logo } from "./Logo";
import { paths } from "../../lib/paths";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-muted">The car care network.</p>
            <div className="mt-4 flex gap-3">
              <a href="#" aria-label="Instagram" className="text-muted hover:text-primary">
                <Instagram size={18} />
              </a>
              <a href="#" aria-label="TikTok" className="text-muted hover:text-primary">
                <Music2 size={18} />
              </a>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Découvrir</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to={paths.explorer} className="hover:text-primary">Explorer</Link></li>
              <li><Link to={paths.discover} className="hover:text-primary">Découvrir</Link></li>
              <li><Link to={paths.becomePro} className="hover:text-primary">Devenir professionnel</Link></li>
              <li><Link to={paths.contact} className="hover:text-primary">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Légal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to={paths.cgv} className="hover:text-primary">CGV</Link></li>
              <li><Link to={paths.legal} className="hover:text-primary">Mentions légales</Link></li>
              <li><Link to={paths.privacy} className="hover:text-primary">Confidentialité</Link></li>
              <li><Link to={paths.cookies} className="hover:text-primary">Cookies</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Compte</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link to={paths.login} className="hover:text-primary">Connexion</Link></li>
              <li><Link to={paths.register} className="hover:text-primary">Inscription</Link></li>
              <li><Link to={paths.proLogin} className="hover:text-primary">Espace professionnel</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted">
          © {new Date().getFullYear()} VEYZA. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
