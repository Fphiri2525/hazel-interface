// src/hooks/useCurrentUser.ts
import { useState, useEffect } from 'react';

type Role = "ADMIN" | "CERTIFICATION_OFFICER" | "INSPECTOR";

export interface LoggedInUser {
  id: number;
  full_name: string;
  email: string;
  role: Role;
}

const STORAGE_KEY = "mbs_user";

export function useCurrentUser() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, loading, logout };
}