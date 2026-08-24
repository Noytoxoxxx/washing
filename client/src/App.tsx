import { Routes, Route } from "react-router-dom";
import { paths } from "./lib/paths";

import { PublicLayout } from "./components/layout/PublicLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ProLayout } from "./components/layout/ProLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ProtectedRoute, GuestOnlyRoute } from "./components/layout/ProtectedRoute";

import { Home } from "./pages/public/Home";
import { Explorer } from "./pages/public/Explorer";
import { Discover } from "./pages/public/Discover";
import { ProfessionalProfile } from "./pages/public/ProfessionalProfile";
import { BecomePro } from "./pages/public/BecomePro";
import { Contact } from "./pages/public/Contact";
import { Cgv } from "./pages/public/legal/Cgv";
import { MentionsLegales } from "./pages/public/legal/MentionsLegales";
import { Confidentialite } from "./pages/public/legal/Confidentialite";
import { Cookies } from "./pages/public/legal/Cookies";
import { NotFound } from "./pages/public/errors/NotFound";
import { Forbidden } from "./pages/public/errors/Forbidden";
import { ServerError } from "./pages/public/errors/ServerError";
import { Login } from "./pages/public/auth/Login";
import { Register } from "./pages/public/auth/Register";
import { ForgotPassword } from "./pages/public/auth/ForgotPassword";
import { ResetPassword } from "./pages/public/auth/ResetPassword";
import { ProLogin } from "./pages/public/auth/ProLogin";
import { AdminLogin } from "./pages/public/auth/AdminLogin";

import { Garage } from "./pages/client/Garage";
import { Favorites } from "./pages/client/Favorites";
import { Follows } from "./pages/client/Follows";
import { Bookings } from "./pages/client/Bookings";
import { NotificationsPage } from "./pages/client/NotificationsPage";
import { ClientSettings } from "./pages/client/ClientSettings";

import { ProOnboarding } from "./pages/pro/ProOnboarding";
import { ProDashboard } from "./pages/pro/ProDashboard";
import { ProProfileEdit } from "./pages/pro/ProProfileEdit";
import { ProServices } from "./pages/pro/ProServices";
import { ProGallery } from "./pages/pro/ProGallery";
import { ProPublications } from "./pages/pro/ProPublications";
import { ProBookings } from "./pages/pro/ProBookings";
import { ProCalendar } from "./pages/pro/ProCalendar";
import { ProClients } from "./pages/pro/ProClients";
import { ProStats } from "./pages/pro/ProStats";
import { ProSettings } from "./pages/pro/ProSettings";

import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminProfessionals } from "./pages/admin/AdminProfessionals";
import { AdminProfessionalCreate } from "./pages/admin/AdminProfessionalCreate";
import { AdminProfessionalDetail } from "./pages/admin/AdminProfessionalDetail";
import { AdminProspects } from "./pages/admin/AdminProspects";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminPosts } from "./pages/admin/AdminPosts";
import { AdminReviews } from "./pages/admin/AdminReviews";
import { AdminReports } from "./pages/admin/AdminReports";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminLogs } from "./pages/admin/AdminLogs";
import { AdminContact } from "./pages/admin/AdminContact";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={paths.home} element={<Home />} />
        <Route path={paths.explorer} element={<Explorer />} />
        <Route path={paths.discover} element={<Discover />} />
        <Route path="/professionnel/:slug" element={<ProfessionalProfile />} />
        <Route path={paths.becomePro} element={<BecomePro />} />
        <Route path={paths.contact} element={<Contact />} />
        <Route path={paths.cgv} element={<Cgv />} />
        <Route path={paths.legal} element={<MentionsLegales />} />
        <Route path={paths.privacy} element={<Confidentialite />} />
        <Route path={paths.cookies} element={<Cookies />} />

        <Route path={paths.login} element={<GuestOnlyRoute redirectTo={paths.home}><Login /></GuestOnlyRoute>} />
        <Route path={paths.register} element={<GuestOnlyRoute redirectTo={paths.home}><Register /></GuestOnlyRoute>} />
        <Route path={paths.forgotPassword} element={<ForgotPassword />} />
        <Route path={paths.resetPassword} element={<ResetPassword />} />
        <Route path={paths.proLogin} element={<GuestOnlyRoute redirectTo={paths.pro}><ProLogin /></GuestOnlyRoute>} />
        <Route path={paths.adminLogin} element={<GuestOnlyRoute redirectTo={paths.admin}><AdminLogin /></GuestOnlyRoute>} />

        <Route path="/403" element={<Forbidden />} />
        <Route path="/500" element={<ServerError />} />

        {/* Client app (shares the public header but adds the client sidebar) */}
        <Route element={<ProtectedRoute roles={["CLIENT"]}><AppLayout /></ProtectedRoute>}>
          <Route path={paths.garage} element={<Garage />} />
          <Route path={paths.favorites} element={<Favorites />} />
          <Route path={paths.follows} element={<Follows />} />
          <Route path={paths.bookings} element={<Bookings />} />
          <Route path={paths.notifications} element={<NotificationsPage />} />
          <Route path={paths.settings} element={<ClientSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Professional space */}
      <Route
        element={
          <ProtectedRoute roles={["PROFESSIONAL"]} loginPath={paths.proLogin}>
            <ProLayout />
          </ProtectedRoute>
        }
      >
        <Route path={paths.pro} element={<ProDashboard />} />
        <Route path={paths.proProfile} element={<ProProfileEdit />} />
        <Route path={paths.proServices} element={<ProServices />} />
        <Route path={paths.proGallery} element={<ProGallery />} />
        <Route path={paths.proPosts} element={<ProPublications />} />
        <Route path={paths.proBookings} element={<ProBookings />} />
        <Route path={paths.proCalendar} element={<ProCalendar />} />
        <Route path={paths.proClients} element={<ProClients />} />
        <Route path={paths.proStats} element={<ProStats />} />
        <Route path={paths.proSettings} element={<ProSettings />} />
      </Route>
      <Route path={paths.proOnboarding} element={<ProtectedRoute roles={["PROFESSIONAL"]} loginPath={paths.proLogin}><ProOnboarding /></ProtectedRoute>} />

      {/* Admin */}
      <Route element={<ProtectedRoute roles={["ADMIN"]} loginPath={paths.adminLogin}><AdminLayout /></ProtectedRoute>}>
        <Route path={paths.admin} element={<AdminDashboard />} />
        <Route path={paths.adminProfessionals} element={<AdminProfessionals />} />
        <Route path={`${paths.adminProfessionals}/nouveau`} element={<AdminProfessionalCreate />} />
        <Route path={`${paths.adminProfessionals}/:id`} element={<AdminProfessionalDetail />} />
        <Route path={paths.adminProspects} element={<AdminProspects />} />
        <Route path={paths.adminUsers} element={<AdminUsers />} />
        <Route path={paths.adminBookings} element={<AdminBookings />} />
        <Route path={paths.adminPosts} element={<AdminPosts />} />
        <Route path={paths.adminReviews} element={<AdminReviews />} />
        <Route path={paths.adminReports} element={<AdminReports />} />
        <Route path={paths.adminSettings} element={<AdminSettings />} />
        <Route path={paths.adminLogs} element={<AdminLogs />} />
        <Route path={paths.adminContact} element={<AdminContact />} />
      </Route>
    </Routes>
  );
}
