import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NetworkBanner from "@/components/NetworkBanner";
import { AuthProvider } from "@/lib/auth-context";
import SiteVisitTracker from "@/components/SiteVisitTracker";
export const metadata: Metadata = {
  title: "Colony Bois | Vinayaka Chavathi",
  description: "Pandal events and transparent Chanda collection.",
  icons: { icon: "/assets/logo.png" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AuthProvider><SiteVisitTracker/><NetworkBanner/><Header/><main className="mx-auto min-h-[calc(100vh-136px)] max-w-7xl px-5 py-8">{children}</main><Footer/></AuthProvider></body></html>; }
