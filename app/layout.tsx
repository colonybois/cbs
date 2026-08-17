import type { Metadata } from "next";
import { Fraunces, Outfit, Yatra_One } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NetworkBanner from "@/components/NetworkBanner";
import { AuthProvider } from "@/lib/auth-context";
import SiteVisitTracker from "@/components/SiteVisitTracker";
import SmoothHashScroll from "@/components/SmoothHashScroll";
import ScrollToTop from "@/components/ScrollToTop";
import { SiteMushikaCompanion } from "@/components/mushika/SiteMushikaCompanion";
import FestiveAtmosphere from "@/components/festive/FestiveAtmosphere";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const yatra = Yatra_One({
  weight: "400",
  subsets: ["latin", "devanagari"],
  variable: "--font-yatra",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Colony Bois | Vinayaka Chavathi",
  description: "Pandal events and transparent Chanda collection.",
  icons: { icon: "/assets/logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable} ${yatra.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SiteVisitTracker />
          <NetworkBanner />
          <Header />
          <FestiveAtmosphere />
          <main className="relative z-10 mx-auto min-h-[calc(100vh-136px)] max-w-7xl px-4 py-5 sm:px-5 sm:py-8">
            {children}
          </main>
          <Footer />
          <ScrollToTop />
          <SiteMushikaCompanion />
          <SmoothHashScroll />
        </AuthProvider>
      </body>
    </html>
  );
}
