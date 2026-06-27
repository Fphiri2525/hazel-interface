import * as React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  User,
  LogOut,
  Sun,
  Moon,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  ClipboardPlus,
  AlertTriangle,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────────────────
   Route map — add new Certificate Officer destinations here.
   ──────────────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  {
    path: "/certificate-officer/product-decision",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    path: "/certificate-officer/record-product",
    label: "Record Product",
    icon: ClipboardPlus,
  },
];

/* ────────────────────────────────────────────────────────────────────────
   Logged-in user — read from the same localStorage key Login.tsx writes
   (STORAGE_KEY = "mbs_user"), same pattern used by the Inspector layout.
   ──────────────────────────────────────────────────────────────────────── */

const USER_STORAGE_KEY = "mbs_user";
const LOGIN_ROUTE = "/login";

interface StoredUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.full_name) return null;
    return parsed as StoredUser;
  } catch {
    return null;
  }
}

function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out",
          "sm:z-40 sm:flex sm:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2.5 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">MBS</p>
              <p className="text-xs text-muted-foreground">Certification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                type="button"
                onClick={() => {
                  navigate(path);
                  onClose();
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Logout confirmation modal — same styled treatment as the Inspector
   layout's logout modal.
   ──────────────────────────────────────────────────────────────────────── */

function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Log out?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              You'll need to sign in again to access the Certification dashboard.
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function TopBar({
  theme,
  onToggleTheme,
  onRequestLogout,
  onOpenSidebar,
  userName,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onRequestLogout: () => void;
  onOpenSidebar: () => void;
  userName: string;
}) {
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => item.path === location.pathname);
  const sectionLabel = current?.label ?? "Certificate Officer";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="leading-tight">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            MBS / Certification Division
          </p>
          <p className="text-sm font-semibold text-foreground">{sectionLabel}</p>
        </div>
      </div>

      <DropdownMenuPrimitive.Root>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="User menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <User className="h-4 w-4" />
            </span>
            <span className="hidden pr-1 sm:inline">{userName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-[200px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          >
            <DropdownMenuPrimitive.Item
              onSelect={onToggleTheme}
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              Switch to {theme === "light" ? "dark" : "light"} theme
            </DropdownMenuPrimitive.Item>

            <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />

            <DropdownMenuPrimitive.Item
              onSelect={onRequestLogout}
              className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </DropdownMenuPrimitive.Root>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   Layout — sidebar + top bar stay mounted; <Outlet /> swaps the page
   underneath as the route changes (Dashboard <-> Record Product).
   ──────────────────────────────────────────────────────────────────────── */

export default function CertificateLayout() {
  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [user, setUser] = React.useState<StoredUser | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  React.useEffect(() => {
    // Load the logged-in user saved by Login.tsx
    setUser(readStoredUser());
  }, []);

  function handleToggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  function handleConfirmLogout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    // 🔑 This is the piece that was missing: the global AuthContext
    // (used by useAuth() in Login.tsx / ProtectedRoute) only updates its
    // `user` state when it hears "mbs_auth_change" or "storage". Without
    // dispatching this, the context still thinks you're logged in, so
    // Login.tsx immediately redirects you right back to your dashboard.
    window.dispatchEvent(new Event("mbs_auth_change"));
    setShowLogoutConfirm(false);
    navigate(LOGIN_ROUTE, { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col sm:ml-60">
        <TopBar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onRequestLogout={() => setShowLogoutConfirm(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          userName={user?.full_name ?? "Certification Officer"}
        />

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}