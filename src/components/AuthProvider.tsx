"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type User, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { auth, clearTokenCookie, configurePersistence, subscribeTokenCookieSync, hasFirebaseConfig } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    const unsubToken = subscribeTokenCookieSync();
    const interval = setInterval(async () => {
      if (auth && auth.currentUser) {
        await auth.currentUser.getIdToken(true);
      }
    }, 50 * 60 * 1000);
    return () => {
      unsubAuth();
      unsubToken();
      clearInterval(interval);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: async (email: string, password: string, remember: boolean) => {
      if (!auth || !hasFirebaseConfig) throw new Error("firebase_auth_not_configured");
      await configurePersistence(remember);
      await signInWithEmailAndPassword(auth, email, password);
    },
    logout: async () => {
      if (auth) await signOut(auth);
      clearTokenCookie();
    },
    resetPassword: async (email: string) => {
      if (!auth || !hasFirebaseConfig) throw new Error("firebase_auth_not_configured");
      await sendPasswordResetEmail(auth, email);
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
