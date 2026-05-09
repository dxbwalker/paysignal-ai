/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8eceff",
          400: "#59b3ff",
          500: "#3b9eff",
          600: "#1a7ff5",
          700: "#1468e1",
          800: "#1754b6",
          900: "#19498f",
        },
        surface: {
          DEFAULT: "#0a0e1a",
          raised: "#111827",
          overlay: "#1e293b",
          glass: "rgba(17, 24, 39, 0.8)",
        },
        score: {
          high: "#34d399",
          medium: "#fbbf24",
          low: "#6b7280",
        },
        accent: {
          cyan: "#22d3ee",
          emerald: "#34d399",
          amber: "#f59e0b",
          rose: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glow-brand": "radial-gradient(ellipse at center, rgba(59, 158, 255, 0.15) 0%, transparent 70%)",
        "glow-emerald": "radial-gradient(ellipse at center, rgba(52, 211, 153, 0.1) 0%, transparent 70%)",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 158, 255, 0.15)",
        "glow-lg": "0 0 40px rgba(59, 158, 255, 0.2)",
        "inner-glow": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
