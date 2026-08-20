const FIREBASE_API_KEY = "AIzaSyDPL1JWi1tpN4zpkAlc4I2YpglOz20T_js";
const FIREBASE_PROJECT_ID = "colony-bois";

type LookupResponse = {
  users?: Array<{ localId?: string }>;
  error?: { message?: string };
};

type FirestoreDoc = {
  fields?: {
    role?: { stringValue?: string };
    status?: { stringValue?: string };
  };
  error?: { message?: string; status?: string };
};

/**
 * Confirms the caller is an active admin using their Firebase ID token.
 * Does not require FIREBASE_SERVICE_ACCOUNT_JSON.
 */
export async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  if (!token) throw new Error("Missing admin authorization.");

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    },
  );
  const lookup = (await lookupResponse.json()) as LookupResponse;
  const uid = lookup.users?.[0]?.localId;
  if (!lookupResponse.ok || !uid) {
    throw new Error(lookup.error?.message || "Please sign in again.");
  }

  const profileResponse = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const profile = (await profileResponse.json()) as FirestoreDoc;
  const role = profile.fields?.role?.stringValue;
  const status = profile.fields?.status?.stringValue;
  if (
    !profileResponse.ok ||
    status !== "active" ||
    (role !== "admin" && role !== "super_admin")
  ) {
    throw new Error("Admin access required.");
  }
}
