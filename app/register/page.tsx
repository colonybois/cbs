"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRegistrationConfig } from "@/hooks/useRegistrationConfig";

/** Keeps legacy/direct registration URLs aligned with the controlled login form. */
export default function RegisterPage() {
  const router = useRouter();
  const { config, loading } = useRegistrationConfig();

  useEffect(() => {
    if (!loading) router.replace(config.hideRegistrationUI ? "/login?notice=registration-hidden" : "/login?mode=register");
  }, [config.hideRegistrationUI, loading, router]);

  return <p className="py-12 text-center text-slate-600">Checking registration access…</p>;
}
