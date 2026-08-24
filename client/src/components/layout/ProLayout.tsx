import { Outlet } from "react-router-dom";
import { LayoutDashboard, User, Wrench, Image, FileText, CalendarCheck, CalendarDays, Users, BarChart3, Settings } from "lucide-react";
import { Header } from "./Header";
import { Sidebar, SidebarSection } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { paths } from "../../lib/paths";

const sections: SidebarSection[] = [
  {
    items: [
      { to: paths.pro, label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: paths.proProfile, label: "Profil", icon: User },
      { to: paths.proServices, label: "Prestations", icon: Wrench },
      { to: paths.proGallery, label: "Galerie", icon: Image },
      { to: paths.proPosts, label: "Publications", icon: FileText },
      { to: paths.proBookings, label: "Réservations", icon: CalendarCheck },
      { to: paths.proCalendar, label: "Calendrier", icon: CalendarDays },
      { to: paths.proClients, label: "Clients", icon: Users },
      { to: paths.proStats, label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    title: "Compte",
    items: [{ to: paths.proSettings, label: "Paramètres", icon: Settings }],
  },
];

export function ProLayout() {
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
