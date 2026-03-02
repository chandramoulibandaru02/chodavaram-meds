import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { auth, onAuthStateChanged, logOut, type User } from "@/services/firebase";

interface AuthUser {
  uid: string;
  phone: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  setPhoneUser: (phone: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Admin password from env or fallback
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "4321";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("pharmacy_user");
    const savedAdmin = localStorage.getItem("pharmacy_admin");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedAdmin === "true") {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const setPhoneUser = (phone: string) => {
    const newUser: AuthUser = { uid: phone, phone, isAdmin: false };
    setUser(newUser);
    localStorage.setItem("pharmacy_user", JSON.stringify(newUser));
  };

  const adminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      const adminUser: AuthUser = { uid: "admin", phone: null, isAdmin: true };
      setUser(adminUser);
      localStorage.setItem("pharmacy_admin", "true");
      localStorage.setItem("pharmacy_user", JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const adminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("pharmacy_admin");
    localStorage.removeItem("pharmacy_user");
    setUser(null);
  };

  const logout = async () => {
    try {
      await logOut();
    } catch {}
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("pharmacy_user");
    localStorage.removeItem("pharmacy_admin");
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, adminLogin, adminLogout, setPhoneUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
