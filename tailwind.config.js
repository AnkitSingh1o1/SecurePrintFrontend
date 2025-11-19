/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1E5FE0",
          black: "#050505",
          gray: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 25px 50px -12px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};

