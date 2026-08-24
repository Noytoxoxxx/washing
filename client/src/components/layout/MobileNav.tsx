import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Home, Compass, Sparkles, CalendarCheck, User, Menu, X, Heart, Car, Settings, LogOut, HelpCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { paths } from "../../lib/paths";

const BASE_ITEMS = [
  { to: paths.home, label: "Accueil", icon: Home, end: true },
  { to: paths.explorer, label: "Explorer", icon: Compass },
  { to: paths.discover, label: "Découvrir", icon: Sparkles },
];

export function MobileNav() {
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const items = user
    ? [...BASE_ITEMS, { to: paths.bookings, label: "Réservations", icon: CalendarCheck }]
    : BASE_ITEMS;

  return (
    <>
      <nav
        aria-label="Navigation mobile"
        className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-white lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${isActive ? "text-primary" : "text-muted"}`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
        {user ? (
          <button onClick={() => setMoreOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted">
            <User size={20} />
            Profil
          </button>
        ) : (
          <Link to={paths.login} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted">
            <User size={20} />
            Connexion
          </Link>
        )}
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMoreOpen(false)} />
          <div className="relative w-full rounded-t-lg bg-white p-4 shadow-pop" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-base font-semibold text-ink">Menu</p>
              <button onClick={() => setMoreOpen(false)} aria-label="Fermer" className="text-muted">
                <X size={20} />
              </button>
            </div>
            <ul className="divide-y divide-border">
              <li>
                <Link to={paths.favorites} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 py-3 text-sm text-text">
                  <Heart size={18} /> Favoris
                </Link>
              </li>
              <li>
                <Link to={paths.garage} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 py-3 text-sm text-text">
                  <Car size={18} /> Mon garage
                </Link>
              </li>
              <li>
                <Link to={paths.settings} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 py-3 text-sm text-text">
                  <Settings size={18} /> Paramètres
                </Link>
              </li>
              <li>
                <Link to={paths.contact} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 py-3 text-sm text-text">
                  <HelpCircle size={18} /> Aide
                </Link>
              </li>
              <li>
                <button onClick={() => { setMoreOpen(false); logout(); }} className="flex w-full items-center gap-3 py-3 text-sm text-danger">
                  <LogOut size={18} /> Déconnexion
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
