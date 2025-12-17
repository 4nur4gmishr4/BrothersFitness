import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // This is crucial for the "dark" class to work
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "gym-red": "#D71921",
        "gym-black": "#0A0A0A",
        "gym-dark": "#121212",
        "gym-gray": "#888888",
        "gym-yellow": "#E8E010",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        dot: ["var(--font-dot)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;