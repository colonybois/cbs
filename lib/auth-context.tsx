"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, initAnalytics } from "@/lib/firebase";
import { recordAudit } from "@/lib/audit";
import type { UserProfile, UserRole, UserStatus } from "@/types";

type AuthState = {
  uid: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  signedIn: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserRole>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Auth state changes before createUserWithEmailAndPassword resolves. Keep the
  // listener from signing out a user while their profile document is being made.
  const creatingProfileFor = useRef<string | null>(null);

  useEffect(() => {
    void initAnalytics();
    return onAuthStateChanged(auth, async user => {
      if (!user) { setProfile(null); setLoading(false); return; }
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        const data = snapshot.data() as Partial<UserProfile> | undefined;
        if (!data && creatingProfileFor.current !== null) {
          setLoading(false);
          return;
        }
        const status: UserStatus = data?.status === "active" || data?.status === "pending" || data?.status === "rejected" || data?.status === "blocked" || data?.status === "suspended" ? data.status : "pending";
        if (status !== "active") { await firebaseSignOut(auth); setProfile(null); return; }
        setProfile({ uid: user.uid, name: data?.name || user.displayName || user.email?.split("@")[0] || "Colony Bois Member", phone: data?.phone || "", role: data?.role === "super_admin" ? "super_admin" : data?.role === "admin" ? "admin" : "member", status, createdAt: data?.createdAt || "" });
      } catch { await firebaseSignOut(auth); setProfile(null); }
      setLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const snapshot = await getDoc(doc(db, "users", credential.user.uid));
    const data = snapshot.data();
    if (data?.status !== "active") {
      await firebaseSignOut(auth);
      throw new Error(data?.status === "pending" ? "PENDING_APPROVAL" : "ACCOUNT_NOT_ACTIVE");
    }
    const role = data?.role === "super_admin" ? "super_admin" : data?.role === "admin" ? "admin" : "member";
    if (role === "admin" || role === "super_admin") {
      void recordAudit({ actorId: credential.user.uid, actorName: data?.name || credential.user.displayName || credential.user.email || "Admin", action: "Admin login", module: "Authentication" });
    }
    return role;
  };
  const register = async (name: string, email: string, password: string, role: UserRole) => {
    creatingProfileFor.current = "creating";
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      creatingProfileFor.current = credential.user.uid;
      const displayName = name.trim();
      await updateProfile(credential.user, { displayName });
      await setDoc(doc(db, "users", credential.user.uid), {
        uid: credential.user.uid,
        name: displayName,
        email: email.trim(),
        phone: "",
        role,
        status: role === "super_admin" ? "active" : "pending",
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      // Do not leave an unusable Auth session behind if the profile write fails.
      await firebaseSignOut(auth);
      throw error;
    } finally {
      creatingProfileFor.current = null;
    }
  };
  const signOut = async () => {
    if (profile?.role === "admin" || profile?.role === "super_admin") {
      try { await recordAudit({ actorId: profile.uid, actorName: profile.name, action: "Admin logout", module: "Authentication" }); } catch { /* Logging must not prevent sign-out. */ }
    }
    await firebaseSignOut(auth);
  };
  return <AuthContext.Provider value={{ uid: profile?.uid || "", name: profile?.name || "", role: profile?.role || "member", status: profile?.status || "pending", signedIn: !!profile, loading, signIn, register, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
