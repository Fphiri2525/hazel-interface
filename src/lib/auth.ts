// src/lib/auth.ts
import { createContext, useContext } from "react";

const STORAGE_KEY = "mbs_user";

export type Role = "ADMIN" | "CERTIFICATION_OFFICER" | "INSPECTOR";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: Role;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ✅ make sure "export" keyword is here
export const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};