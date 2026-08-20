"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import Button from "@/components/ui/Button";
import type { UserRole } from "@/types";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRegistrationConfig, type RegistrationRole } from "@/hooks/useRegistrationConfig";

export default function Login() {
  const isOnline = useNetworkStatus();
  const { signIn, register, signOut } = useAuth();
  const router = useRouter();
  const { config: registrationConfig } = useRegistrationConfig();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [requestedRole, setRequestedRole] = useState<RegistrationRole>("member");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "register" && !registrationConfig.hideRegistrationUI)
      setMode("register");
    if (params.get("notice") === "registration-hidden")
      setError("Registration is currently unavailable. Please contact the administration.");
  }, [registrationConfig.hideRegistrationUI]);

  useEffect(() => {
    if (registrationConfig.hideRegistrationUI && mode === "register") setMode("signin");
  }, [mode, registrationConfig.hideRegistrationUI]);

  useEffect(() => {
    if (!registrationConfig.allowedRoles.includes(requestedRole))
      setRequestedRole(registrationConfig.allowedRoles[0] || "member");
  }, [registrationConfig.allowedRoles, requestedRole]);

  const routeFor = (userRole: UserRole) =>
    router.push(
      userRole === "admin" || userRole === "super_admin" ? "/admin/dashboard" : "/member/dashboard",
    );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isOnline) {
      setError("Offline — reconnect to sign in or register.");
      return;
    }
    if (mode === "register" && !window.confirm("Submit this registration request?")) return;
    setSubmitting(true);
    try {
      if (mode === "signin") {
        routeFor(await signIn(email, password));
        return;
      }
      // The listener above supplies this UI state. Do not make a second Firestore
      // read here: when Firestore is reconnecting that read can leave the form
      // stuck in its submitting state. The create rule still enforces this server-side.
      if (!registrationConfig.isRegistrationOpen) throw new Error("REGISTRATION_CLOSED");
      if (!registrationConfig.allowedRoles.includes(requestedRole))
        throw new Error("ROLE_REGISTRATION_DISABLED");
      await register(name, email, password, requestedRole);
      // Firebase signs the new account in as part of registration. Do not make a
      // second password request here: it can race the just-created auth session.
      // New accounts must be approved before signing in; sign out only after the
      // profile write is complete so Firestore receives an authenticated request.
      await signOut();
      setMode("signin");
      setError(
        "Your account registration is pending admin approval. Please contact an administrator.",
      );
    } catch (reason) {
      // Firebase Auth error codes come as reason.code, custom errors as reason.message
      const code =
        reason instanceof Error && "code" in reason
          ? (reason as { code: string }).code
          : reason instanceof Error
            ? reason.message
            : "";
      const msg =
        code === "REGISTRATION_CLOSED"
          ? "Registrations are currently closed by the administration."
          : code === "ROLE_REGISTRATION_DISABLED"
            ? "Registration for that role is currently unavailable."
            : code === "PENDING_APPROVAL"
              ? "Your account is pending admin approval. Please wait for confirmation."
              : code === "auth/email-already-in-use"
                ? "An account with this email already exists. Try signing in instead."
                : code === "auth/weak-password"
                  ? "Password must be at least 6 characters."
                  : code === "auth/invalid-email"
                    ? "Please enter a valid email address."
                    : code === "auth/operation-not-allowed"
                      ? "Email/password registration is not enabled. Please contact an administrator."
                      : code === "auth/too-many-requests"
                        ? "Too many attempts. Please wait a few minutes and try again."
                        : code === "auth/user-not-found" ||
                            code === "auth/wrong-password" ||
                            code === "auth/invalid-credential"
                          ? "Incorrect email or password."
                          : mode === "signin"
                            ? "Unable to sign in. Check your email and password and try again."
                            : "Unable to create your account. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };
  const changeMode = (next: "signin" | "register") => {
    setMode(next);
    setError("");
  };

  const regClosed =
    !registrationConfig.isRegistrationOpen || registrationConfig.allowedRoles.length === 0;
  const registrationHidden = registrationConfig.hideRegistrationUI;

  return (
    <div className="mx-auto mt-8 max-w-md rounded-3xl border border-saffron-200 bg-white/90 p-7 shadow-gold">
      <div className="flex rounded-xl bg-white p-1">
        <button
          onClick={() => changeMode("signin")}
          className={`flex-1 rounded-lg py-2 text-sm font-bold ${mode === "signin" ? "bg-white text-saffron-700 shadow-sm" : "text-slate-600"}`}
        >
          Sign in
        </button>
        {!registrationHidden && (
          <button
            onClick={() => changeMode("register")}
            disabled={regClosed}
            className={`flex-1 rounded-lg py-2 text-sm font-bold disabled:cursor-not-allowed ${mode === "register" ? "bg-white text-saffron-700 shadow-sm" : regClosed ? "text-slate-400" : "text-slate-600"}`}
          >
            Register {regClosed && <span className="ml-1 text-xs">(Closed)</span>}
          </button>
        )}
      </div>
      {regClosed && mode === "register" && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          Registrations are currently closed by the administration.
        </div>
      )}
      <p className="mt-2 font-yatra text-lg text-saffron-700">Ganpati Bappa Morya</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[.22em] text-navy">
        Colony Bois secure access
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {mode === "signin" ? "Welcome back" : "Create an account"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {mode === "signin"
          ? "Sign in with your organizer or volunteer account."
          : "New accounts require admin approval."}
      </p>
      {!(regClosed && mode === "register") && (
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "register" && (
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-saffron-200 bg-white p-3"
            />
          )}
          {mode === "register" && (
            <label className="block text-sm font-semibold text-slate-700">
              Requested role
              <select
                value={requestedRole}
                onChange={(event) => setRequestedRole(event.target.value as RegistrationRole)}
                className="mt-1 w-full rounded-xl border border-saffron-200 bg-white p-3"
              >
                {registrationConfig.allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {role === "admin" ? "Admin" : "Volunteer member"}
                  </option>
                ))}
              </select>
            </label>
          )}
          <input
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="Email address"
            className="w-full rounded-xl border border-saffron-200 bg-white p-3"
          />
          <input
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Password (at least 6 characters)"
            className="w-full rounded-xl border border-saffron-200 bg-white p-3"
          />
          {!isOnline && (
            <p className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-saffron-800">
              Offline — Reconnect to submit
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-rose-600">
              {error}
            </p>
          )}
          <Button disabled={submitting || !isOnline} type="submit" className="w-full">
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
      )}
    </div>
  );
}
