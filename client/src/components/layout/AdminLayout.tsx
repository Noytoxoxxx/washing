import { Outlet } from "react-router-dom";
import { LayoutDashboard, Briefcase, UserPlus, Users, CalendarCheck, FileText, Star, Flag, Settings, ScrollText, Mail } from "lucide-react";
import { Header } from "./Header";
import { Sidebar, SidebarSection } from "./Sidebar";
import { paths } from "../../lib/paths";

const sections: SidebarSection[] = [
  {
    items: [
      { to: paths.admin, label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: paths.adminProfessionals, label: "Professionnels", icon: Briefcase },
      { to: paths.adminProspects, label: "Prospects", icon: UserPlus },
      { to: paths.adminUsers, label: "Utilisateurs", icon: Users },
      { to: paths.adminBookings, label: "Réservations", icon: CalendarCheck },
      { to: paths.adminPosts, label: "Publications", icon: FileText },
      { to: paths.adminReviews, label: "Avis", icon: Star },
      { to: paths.adminReports, label: "Signalements", icon: Flag },
      { to: paths.adminContact, label: "Messages", icon: Mail },
    ],
  },
  {
    title: "Système",
    items: [
      { to: paths.adminSettings, label: "Paramètres", icon: Settings },
      { to: paths.adminLogs, label: "Logs", icon: ScrollText },
    ],
  },
];

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl flex-1">
        <Sidebar sections={sections} />
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
