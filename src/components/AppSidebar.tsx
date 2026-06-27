import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Package, ClipboardCheck, FlaskConical, Award, ShieldCheck,
  LogOut, Bell, Users,
} from "lucide-react";
import logoImg from "@/assets/mbs-logo.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Products", icon: Package, path: "/products" },
  { label: "Inspections", icon: ClipboardCheck, path: "/inspections" },
  { label: "Lab Results", icon: FlaskConical, path: "/lab-results" },
  { label: "Certifications", icon: Award, path: "/certifications" },
  { label: "Compliance", icon: ShieldCheck, path: "/compliance" },
  { label: "Alerts", icon: Bell, path: "/alerts" },
  { label: "Users", icon: Users, path: "/users", adminOnly: true },
];

const AppSidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-white text-gray-900">
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <img src={logoImg} alt="MBS" className="h-10 w-10 rounded" />
        <div>
          <p className="text-sm font-bold text-gray-900">MBS FQTS</p>
          <p className="text-xs text-gray-500">Food Quality System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems
            .filter((item) => !("adminOnly" in item) || user?.role === "ADMIN")
            .map((item) => {
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
            {user?.full_name?.charAt(0) ?? "U"}
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
            <p className="text-xs capitalize text-gray-500">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;