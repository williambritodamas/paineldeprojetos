// Configuração do Tailwind CSS para o tema escuro do painel.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tema escuro baseado em tons de grafite.
        base: {
          950: "#060a12",
          900: "#0a0f1a",
          800: "#111827",
          700: "#1a2332",
          600: "#222c3d",
          500: "#2e3a4d",
        },
        destaque: {
          DEFAULT: "#38bdf8",
          escura: "#0ea5e9",
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};