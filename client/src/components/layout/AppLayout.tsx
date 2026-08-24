import { Outlet } from "react-router-dom";
import { Home, Compass, Sparkles, CalendarCheck, Heart, Car, User, Settings } from "lucide-react";
import { Header } from "./Header";
import { Sidebar, SidebarSection } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { paths } from "../../lib/paths";

const sections: SidebarSection[] = [
  {
    items: [
      { to: paths.home, label: "Accueil", icon: Home, end: true },
      { to: paths.explorer, label: "Explorer", icon: Compass },
      { to: paths.discover, label: "Découvrir", icon: Sparkles },
      { to: paths.bookings, label: "Réservations", icon: CalendarCheck },
      { to: paths.favorites, label: "Favoris", icon: Heart },
      { to: paths.garage, label: "Mon garage", icon: Car },
    ],
  },
  {
    title: "Compte",
    items: [
      { to: paths.settings, label: "Paramètres", icon: Settings },
    ],
  },
];

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar sections={sections} />
        <main className="min-w-0 flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
