import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: "#080706",
        velvet: "#17110d",
        gold: "#d7aa4d",
        champagne: "#fff1c7",
        danger: "#ff4d4d",
        lagoon: "#39c6b4"
      },
      boxShadow: {
        glow: "0 0 42px rgba(215, 170, 77, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
