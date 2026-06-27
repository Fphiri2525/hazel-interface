// src/components/AuthProvider.tsx
import { useState, useEffect, useCallback, ReactNode } from "react";
import { AuthContext, User, getStoredUser } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "mbs_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.dispatchEvent(new Event("mbs_auth_change"));
  }, []);

  useEffect(() => {
    const handleAuthChange = () => setUser(getStoredUser());
    window.addEventListener("mbs_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("mbs_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};