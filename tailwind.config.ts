import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, neurodivergent-friendly palette — avoid harsh reds for streak breaks
        // Earth + sage tones; "warning" is amber not red
        bg: {
          DEFAULT: "#FAFAF7",
          dark: "#0F0F0E",
        },
        ink: {
          DEFAULT: "#1A1A19",
          muted: "#6B6B66",
        },
        sage: {
          50: "#F2F5F1",
          100: "#E3EAE0",
          200: "#C7D6C0",
          300: "#9FB893",
          400: "#7A9C6B",
          500: "#5C7E4D",
          600: "#46643A",
          700: "#385030",
          800: "#2E4029",
          900: "#263422",
        },
        sun: {
          50: "#FDF7E9",
          100: "#FAEBC4",
          500: "#E0A526",
          600: "#B98319",
        },
        // Neutral amber for streak breaks — no red
        neutral: {
          break: "#D4B896",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
