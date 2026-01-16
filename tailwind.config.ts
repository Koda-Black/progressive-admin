import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B6B",
        background: "#000000",
        surface: "#121212",
        sunsetOrange: "#FE9A00",
        graytransparent: "rgba(209, 209, 209, 0.05)",
        steelBlue: "#90A1B9",
        "text-muted": "rgba(255, 255, 255, 0.4)",
      },
      fontFamily: {
        sans: ["Nunito Sans", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
