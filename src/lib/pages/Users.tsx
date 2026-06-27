import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, AlertTriangle } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   Users — backed by the real API instead of DEMO_USERS.

   GET  /api/users  → list users (id, name, email, role, created_at)
   POST /api/users   → create user { name, email, password, role }

   Roles match what's already used across the app: admin, inspector,
   lab_personnel, supervisor.
   ──────────────────────────────────────────────────────────────────────── */

// LOCAL DEV: point this at your Node server. Update the port if you
// changed PORT in your .env.
const API_BASE_URL = "http://localhost:5000";
const USERS_URL = `${API_BASE_URL}/api/users`;

interface User {
  id: number;
  full_name: string;
  email: string;
  role: "ADMIN" | "CERTIFICATION_OFFICER" | "INSPECTOR";
  created_at?: string;
}

const ROLE_OPTIONS: { value: User["role"]; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "CERTIFICATION_OFFICER", label: "Certification Officer" },
  { value: "INSPECTOR", label: "Inspector" },
];

const roleColors: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary border-primary/30",
  CERTIFICATION_OFFICER: "bg-success/10 text-success border-success/30",
  INSPECTOR: "bg-info/10 text-info border-info/30",
};

const Users = () => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<User["role"] | "">("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState("");

  const canSubmit = !!fullName && !!email && !!password && !!role && !submitting;

  async function fetchUsers() {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(USERS_URL);
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data?.error || "Failed to load users.");
        return;
      }
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch {
      setLoadError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchUsers();
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("");
    setSubmitError("");
  }

  async function handleAddUser() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error || "Failed to add user.");
        setSubmitting(false);
        return;
      }

      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch {
      setSubmitError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">System users and roles</p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {submitError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="user-name">Full Name</Label>
                <Input
                  id="user-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as User["role"])}>
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="Select a role…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={!canSubmit} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Adding…" : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loadError && (
            <div className="flex items-start gap-2 border-b border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No users yet. Click "Add User" to create one.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{u.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`capitalize ${roleColors[u.role] ?? ""}`}
                      >
                        {u.role.replace(/_/g, " ").toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;