/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Cobalt is the single accent of the product. Everything else is
        // neutral so the accent keeps its meaning.
        cobalt: {
          DEFAULT: "#0047AB",
          hover: "#003D93",
          soft: "#EDF2FB",
          ring: "#3B6FC4",
        },
        ink: {
          DEFAULT: "#0B0D12",
          muted: "#5A6172",
          subtle: "#8A90A0",
          line: "#E7E8EC",
          wash: "#F7F8FA",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      spacing: {
        // 8px base grid helpers (Tailwind's default scale is already 4px,
        // these name the common 8px multiples used across the app).
        18: "4.5rem",
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 13, 18, 0.04), 0 0 0 1px rgba(11, 13, 18, 0.03)",
        raised:
          "0 1px 2px rgba(11, 13, 18, 0.05), 0 8px 24px -8px rgba(11, 13, 18, 0.12)",
        overlay:
          "0 24px 48px -12px rgba(11, 13, 18, 0.28), 0 0 0 1px rgba(11, 13, 18, 0.05)",
        focus: "0 0 0 3px rgba(0, 71, 171, 0.18)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        "fade-in-up": "fade-in-up 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
