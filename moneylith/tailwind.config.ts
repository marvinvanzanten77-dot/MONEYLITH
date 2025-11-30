import { defineConfig } from "tailwindcss";

export default defineConfig({
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "moneylith-ink": "#030712",
        "moneylith-panel": "#0d1320",
        "moneylith-border": "#1f2933",
        "moneylith-muted": "#94a3b8",
        "moneylith-emerald": "#1ab394",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
});
