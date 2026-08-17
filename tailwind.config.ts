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
        surface: { DEFAULT: "#fffbf5", tint: "#fff4e6", muted: "#f8efe4" },
        saffron: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          DEFAULT: "#e85d04",
          600: "#d94a0a",
          700: "#b83a08",
          800: "#9a3412",
          900: "#7c2d12",
        },
        festive: {
          amber: "#f59e0b",
          gold: "#c9a227",
          kumkum: "#9f1239",
          peacock: "#0f766e",
          sandal: "#3f2a14",
        },
        content: { main: "#3f2a14", muted: "#6b5344", light: "#a18a76" },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        yatra: ["var(--font-yatra)", "cursive"],
      },
      boxShadow: {
        temple: "0 18px 44px -18px rgba(184, 58, 8, 0.28)",
        gold: "0 0 0 1px rgba(201, 162, 39, 0.28), 0 16px 36px -18px rgba(232, 93, 4, 0.22)",
      },
      backgroundImage: {
        "festive-wash":
          "radial-gradient(ellipse 80% 50% at 50% -8%, rgba(251, 146, 60, 0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(201, 162, 39, 0.16), transparent 50%), radial-gradient(ellipse 40% 30% at 0% 100%, rgba(159, 18, 57, 0.06), transparent 45%)",
      },
      letterSpacing: {
        kicker: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;
