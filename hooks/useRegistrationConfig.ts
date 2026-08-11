"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type RegistrationRole = "member" | "admin";
export type RegistrationConfig = {
  isRegistrationOpen: boolean;
  hideRegistrationUI: boolean;
  allowedRoles: RegistrationRole[];
};

export const defaultRegistrationConfig: RegistrationConfig = {
  isRegistrationOpen: true,
  hideRegistrationUI: false,
  allowedRoles: ["member"],
};

export function useRegistrationConfig() {
  const [config, setConfig] = useState<RegistrationConfig>(defaultRegistrationConfig);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "site_settings", "registration_config"),
        (snapshot) => {
          const data = snapshot.data();
          const allowedRoles = Array.isArray(data?.allowedRoles)
            ? data.allowedRoles.filter(
                (role): role is RegistrationRole => role === "member" || role === "admin",
              )
            : defaultRegistrationConfig.allowedRoles;
          setConfig({
            isRegistrationOpen: data?.isRegistrationOpen !== false,
            hideRegistrationUI: data?.hideRegistrationUI === true,
            allowedRoles,
          });
          setLoading(false);
        },
        () => setLoading(false),
      ),
    [],
  );

  return { config, loading };
}
