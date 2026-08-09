import { redirect } from "next/navigation";

/** Canonical operational dashboard route. */
export default function AdminIndexPage() { redirect("/admin/dashboard"); }
