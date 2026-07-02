// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type Role = "ADMIN" | "COMPANY" | "INSPECTOR";

interface Props {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ROLE_HOME: Record<Role, string> = {
  ADMIN:     "/dashboard",
  COMPANY:   "/certificate-officer/record-product",
  INSPECTOR: "/inspector/dashboard",
};

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Not logged in → kick to /login, remember where they were going
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Logged in but wrong role → redirect to their correct home
  if (!allowedRoles.includes(user.role as Role)) {
    const home = ROLE_HOME[user.role as Role] ?? "/login";
    return <Navigate to={home} replace />;
  }

  // 3. All good
  return <>{children}</>;
};

export default ProtectedRoute;