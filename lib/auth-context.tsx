"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, initAnalytics } from "@/lib/firebase";
import type { UserProfile, UserRole, UserStatus } from "@/types";

type AuthState = {
  uid: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  signedIn: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserRole>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void initAnalytics();
    return onAuthStateChanged(auth, async user => {
      if (!user) { setProfile(null); setLoading(false); return; }
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.data() as Partial<UserProfile> | undefined;
        setProfile({ uid: user.uid, name: data?.name || user.displayName || user.email?.split("@")[0] || "Colony Bois Member", phone: data?.phone || "", role: data?.role === "admin" ? "admin" : "member", status: data?.status === "blocked" ? "blocked" : "active", createdAt: data?.createdAt || "" });
      } catch { setProfile({ uid: user.uid, name: user.displayName || user.email?.split("@")[0] || "Colony Bois Member", phone: "", role: "member", status: "active", createdAt: "" }); }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snapshot = await getDoc(doc(db, "users", credential.user.uid));
    const role = snapshot.data()?.role === "admin" ? "admin" : "member";
    return role;
  };
  const signOut = () => firebaseSignOut(auth);
  return <AuthContext.Provider value={{ uid: profile?.uid || "", name: profile?.name || "", role: profile?.role || "member", status: profile?.status || "active", signedIn: !!profile, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
