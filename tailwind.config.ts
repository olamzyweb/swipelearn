import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1200px"
      }
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-fraunces)", "ui-serif", "Georgia"]
      },
      colors: {
        ink: {
          900: "#0b0f1a",
          800: "#12192b",
          700: "#1a2440"
        },
        cloud: {
          50: "#f5f7fb",
          100: "#eef1f7",
          200: "#e1e6f0"
        },
        mint: {
          500: "#46e0b7",
          600: "#25cfa0"
        },
        coral: {
          500: "#ff7b7b",
          600: "#f06565"
        },
        sun: {
          500: "#ffd166"
        }
      },
      boxShadow: {
        soft: "0 20px 60px rgba(15, 23, 42, 0.18)",
        card: "0 16px 32px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        }
      },
      animation: {
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
