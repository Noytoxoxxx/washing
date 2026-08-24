import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../ui/PageLoader";
import { paths } from "../../lib/paths";
import type { Role } from "../../types";

export function ProtectedRoute({ roles, loginPath = paths.login, children }: { roles: Role[]; loginPath?: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={`${loginPath}?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}

export function GuestOnlyRoute({ redirectTo, children }: { redirectTo: string; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) {
    // Always send an already-authenticated user to THEIR space, regardless of which
    // guest-only page they landed on (e.g. a professional opening /connexion or /inscription).
    const roleHome = user.role === "PROFESSIONAL" ? paths.pro : user.role === "ADMIN" ? paths.admin : redirectTo;
    return <Navigate to={roleHome} replace />;
  }
  return <>{children}</>;
}
