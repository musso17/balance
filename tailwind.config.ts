import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./store/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(210 40% 98%)",
        foreground: "hsl(210 20% 15%)",
        muted: "hsl(210 16% 90%)",
        "muted-foreground": "hsl(210 10% 45%)",
        border: "hsl(210 14% 89%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 24px 48px -32px rgba(15, 23, 42, 0.2)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant("supports-backdrop", "@supports ((-webkit-backdrop-filter: none) or (backdrop-filter: none)) &");
    }),
  ],
};

export default config;

