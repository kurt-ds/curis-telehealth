/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        curis: {
          50:  "#eef9ff",
          100: "#d9f1ff",
          200: "#bce8ff",
          300: "#8ed9ff",
          400: "#59c2ff",
          500: "#34a4fd",
          600: "#1a83f2",
          700: "#136bde",
          800: "#1657b4",
          900: "#184b8e",
          950: "#132e56",
        },
        accent: {
          teal:   "#0fd7c2",
          purple: "#7c3aed",
        },
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #132e56 100%)",
        "card-gradient":
          "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      },
      animation: {
        "fade-in":    "fadeIn 0.6s ease forwards",
        "slide-up":   "slideUp 0.5s ease forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
