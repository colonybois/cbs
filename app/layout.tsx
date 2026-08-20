import type { Metadata } from "next";
import { Cinzel, Playfair_Display, Poppins, Yatra_One } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NetworkBanner from "@/components/NetworkBanner";
import { AuthProvider } from "@/lib/auth-context";
import { ChatPanelProvider } from "@/components/chat/ChatPanelContext";
import PublicFaqChat from "@/components/chat/PublicFaqChat";
import SiteVisitTracker from "@/components/SiteVisitTracker";
import SmoothHashScroll from "@/components/SmoothHashScroll";
import ScrollToTop from "@/components/ScrollToTop";
import { SiteMushikaCompanion } from "@/components/mushika/SiteMushikaCompanion";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cinzel",
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
    <html
      lang="en"
      className={`${poppins.variable} ${playfair.variable} ${cinzel.variable} ${yatra.variable}`}
    >
      <body className="bg-white font-sans antialiased">
        <AuthProvider>
          <ChatPanelProvider>
            <SiteVisitTracker />
            <NetworkBanner />
            <Header />
            <main className="relative z-10 mx-auto min-h-[calc(100vh-136px)] max-w-7xl bg-white px-4 py-5 sm:px-6 sm:py-8">
              {children}
            </main>
            <Footer />
            <ScrollToTop />
            <SiteMushikaCompanion />
            <SmoothHashScroll />
            <PublicFaqChat />
          </ChatPanelProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
