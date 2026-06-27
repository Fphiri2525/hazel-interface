// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import foodImg from "@/assets/food.jpg";
import logoImg from "@/assets/mbs-logo.png";

const API_BASE_URL = "http://localhost:5000";
const LOGIN_URL = `${API_BASE_URL}/api/auth/login`;
const STORAGE_KEY = "mbs_user";

type Role = "ADMIN" | "CERTIFICATION_OFFICER" | "INSPECTOR";

interface LoggedInUser {
  id: number;
  full_name: string;
  email: string;
  role: Role;
}

const ROUTES_BY_ROLE: Record<Role, string> = {
  CERTIFICATION_OFFICER: "/certificate-officer/product-decision",
  INSPECTOR:             "/inspector/dashboard",
  ADMIN:                 "/dashboard",
};

const DEFAULT_ROUTE = "/dashboard";

const Login = () => {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // ── Already logged in? Send them straight to their home page ────────
  // This is what blocks the back-button from returning to /login
  if (isAuthenticated && user) {
    const home = ROUTES_BY_ROLE[user.role as Role] ?? DEFAULT_ROUTE;
    return <Navigate to={home} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Login failed. Please check your email and password.");
        setSubmitting(false);
        return;
      }

      const user: LoggedInUser = {
        ...data.user,
        role: (data.user?.role ?? "").toUpperCase() as Role,
      };

      const destination = ROUTES_BY_ROLE[user.role] ?? DEFAULT_ROUTE;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event("mbs_auth_change"));

      toast.success(`Welcome back, ${user.full_name}`);
      navigate(destination, { replace: true });

    } catch (err) {
      toast.error("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-4xl overflow-hidden shadow-xl">
        <div className="grid md:grid-cols-2">
          {/* Left side - branding */}
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-8">
            <img src={logoImg} alt="MBS Logo" className="mb-4 h-16 w-auto" />
            <img
              src={foodImg}
              alt="Food Quality"
              className="w-full max-w-xs rounded-xl object-cover shadow-lg"
              width={640}
              height={640}
            />
          </div>

          {/* Right side - form */}
          <CardContent className="flex flex-col justify-center p-8">
            <h1 className="mb-1 font-display text-2xl font-bold text-foreground">Login</h1>
            <p className="mb-6 text-sm text-muted-foreground">Food Quality Tracking System</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="username@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="text-right">
                <Link to="#" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};

export default Login;