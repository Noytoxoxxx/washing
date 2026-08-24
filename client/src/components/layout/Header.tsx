import { Link, NavLink, useNavigate } from "react-router-dom";
import { User, Heart, Car, CalendarCheck, Settings, LogOut, LayoutDashboard, Briefcase, Shield, Users, FileText } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { paths } from "../../lib/paths";
import { Logo } from "./Logo";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { Dropdown, DropdownItem } from "../ui/Dropdown";
import { Button } from "../ui/Button";

const NAV_LINKS = [
  { to: paths.home, label: "Accueil" },
  { to: paths.explorer, label: "Explorer" },
  { to: paths.discover, label: "Découvrir" },
  { to: paths.becomePro, label: "Devenir professionnel" },
];

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

export function Header() {
  const { user, logout, professionalProfile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(paths.home);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-primary" : "text-text hover:text-primary"
                }`
              }
              end={link.to === paths.home}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden flex-1 md:block">
          <GlobalSearch />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Dropdown
                align="right"
                trigger={({ toggle }) => (
                  <button onClick={toggle} aria-label="Menu du compte" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      initials(user.firstName, user.lastName)
                    )}
                  </button>
                )}
              >
                {(close) => (
                  <div>
                    <div className="border-b border-border px-4 py-2.5">
                      <p className="text-sm font-medium text-ink">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    {user.role === "ADMIN" && (
                      <>
                        <DropdownItem icon={<LayoutDashboard size={16} />} onClick={() => { close(); navigate(paths.admin); }}>
                          Dashboard
                        </DropdownItem>
                        <DropdownItem icon={<Briefcase size={16} />} onClick={() => { close(); navigate(paths.adminProfessionals); }}>
                          Professionnels
                        </DropdownItem>
                        <DropdownItem icon={<Users size={16} />} onClick={() => { close(); navigate(paths.adminUsers); }}>
                          Utilisateurs
                        </DropdownItem>
                        <DropdownItem icon={<CalendarCheck size={16} />} onClick={() => { close(); navigate(paths.adminBookings); }}>
                          Réservations
                        </DropdownItem>
                        <DropdownItem icon={<FileText size={16} />} onClick={() => { close(); navigate(paths.adminPosts); }}>
                          Publications
                        </DropdownItem>
                        <DropdownItem icon={<Settings size={16} />} onClick={() => { close(); navigate(paths.adminSettings); }}>
                          Paramètres
                        </DropdownItem>
                      </>
                    )}
                    {user.role === "PROFESSIONAL" && (
                      <>
                        <DropdownItem icon={<LayoutDashboard size={16} />} onClick={() => { close(); navigate(paths.pro); }}>
                          Dashboard
                        </DropdownItem>
                        <DropdownItem icon={<User size={16} />} onClick={() => { close(); navigate(paths.proProfile); }}>
                          Profil
                        </DropdownItem>
                        <DropdownItem icon={<CalendarCheck size={16} />} onClick={() => { close(); navigate(paths.proBookings); }}>
                          Réservations
                        </DropdownItem>
                        <DropdownItem icon={<Shield size={16} />} onClick={() => { close(); navigate(paths.proCalendar); }}>
                          Calendrier
                        </DropdownItem>
                        <DropdownItem icon={<Settings size={16} />} onClick={() => { close(); navigate(paths.proSettings); }}>
                          Paramètres
                        </DropdownItem>
                        {professionalProfile?.slug && (
                          <DropdownItem icon={<Briefcase size={16} />} onClick={() => { close(); navigate(paths.professional(professionalProfile.slug)); }}>
                            Voir mon profil public
                          </DropdownItem>
                        )}
                      </>
                    )}
                    {user.role === "CLIENT" && (
                      <>
                        <DropdownItem icon={<User size={16} />} onClick={() => { close(); navigate(paths.settings); }}>
                          Mon profil
                        </DropdownItem>
                        <DropdownItem icon={<Car size={16} />} onClick={() => { close(); navigate(paths.garage); }}>
                          Mon garage
                        </DropdownItem>
                        <DropdownItem icon={<CalendarCheck size={16} />} onClick={() => { close(); navigate(paths.bookings); }}>
                          Mes réservations
                        </DropdownItem>
                        <DropdownItem icon={<Heart size={16} />} onClick={() => { close(); navigate(paths.favorites); }}>
                          Favoris
                        </DropdownItem>
                        <DropdownItem icon={<Settings size={16} />} onClick={() => { close(); navigate(paths.settings); }}>
                          Paramètres
                        </DropdownItem>
                      </>
                    )}
                    <div className="mt-1 border-t border-border pt-1">
                      <DropdownItem icon={<LogOut size={16} />} danger onClick={() => { close(); handleLogout(); }}>
                        Déconnexion
                      </DropdownItem>
                    </div>
                  </div>
                )}
              </Dropdown>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to={paths.login} className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
              </Link>
              <Link to={paths.register}>
                <Button size="sm">Inscription</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
