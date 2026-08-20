import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          dark: "var(--primary-dark)",
          soft: "var(--primary-soft)",
        },
        secondary: "var(--secondary)",
        accent: {
          DEFAULT: "var(--accent)",
          bright: "var(--accent-bright)",
        },
        navy: {
          DEFAULT: "var(--navy)",
          dark: "var(--navy-dark)",
          soft: "var(--navy-soft)",
        },
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--background)",
          tint: "var(--background-warm)",
          muted: "var(--ivory)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          soft: "var(--gold-soft)",
        },
        saffron: {
          50: "#FDFCF8",
          100: "#F7F3EA",
          200: "#E8D5A3",
          300: "#D4B45C",
          400: "#C4A445",
          DEFAULT: "#B08D21",
          600: "#8B6600",
          700: "#8B6600",
          800: "#6F5200",
          900: "#4A3700",
        },
        festive: {
          amber: "#8B6600",
          gold: "#B08D21",
          kumkum: "#8B6600",
          peacock: "#5c5c5c",
          sandal: "#333333",
        },
        ink: "var(--heading)",
        content: {
          main: "var(--text)",
          muted: "var(--text-muted)",
          light: "var(--text-light)",
        },
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
        cinzel: ["var(--font-cinzel)", "Georgia", "serif"],
        yatra: ["var(--font-yatra)", "cursive"],
      },
      boxShadow: {
        temple: "0 18px 44px -18px rgba(15, 23, 42, 0.08)",
        gold: "0 0 0 1px rgba(229, 165, 26, 0.22), 0 16px 36px -18px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "festive-wash": "none",
      },
      letterSpacing: {
        kicker: "0.22em",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
    },
  },
  plugins: [],
};

export default config;
