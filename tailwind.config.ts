import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#08090b",
        panel: "#111318",
        line: "#262a33",
        accent: "#f5c542"
      }
    }
  },
  plugins: []
};

export default config;
