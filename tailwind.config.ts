import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#12224D",
        deep: "#1E86E8",
        sky: "#57C6F5",
        paper: "#F7FAFD",
        surface: "#FFFFFF",
        "bg-soft": "#EEF5FC",
        border: {
          DEFAULT: "#E7ECF6",
          strong: "#CBD9E8",
        },
        ink: "#12224D",
        muted: {
          DEFAULT: "#4A5578",
          light: "#7A87AC",
        },
        "accent-soft": "#EEF5FC",
        "sky-soft": "#EAF9FD",
        warn: { DEFAULT: "#96700A", soft: "#FBF0D9" },
        danger: "#B3261E",
        whatsapp: { DEFAULT: "#25D366", dark: "#1EBE5B" },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        placeholder:
          "repeating-linear-gradient(135deg,#EEF5FC,#EEF5FC 10px,#E1EEFA 10px,#E1EEFA 20px)",
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "22px",
      },
      boxShadow: {
        sm: "0 1px 3px rgba(21,34,56,0.05)",
        md: "0 10px 28px rgba(21,34,56,0.08)",
        lift: "0 18px 40px rgba(21,34,56,0.13)",
      },
    },
  },
  plugins: [],
};

export default config;
