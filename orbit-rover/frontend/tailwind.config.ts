import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        orbit: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          400: "#748ffc",
          500: "#4c6ef5",
          600: "#3b5bdb",
          700: "#364fc7",
          900: "#1e2a5e",
        },
        surface: {
          DEFAULT: "#fafaf9",
          card: "#ffffff",
          muted: "#f5f5f4",
          border: "#e7e5e4",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-instrument)", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)",
        hero: "0 24px 80px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
