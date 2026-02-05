/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          dark: '#0f172a',
          darker: '#0a0f1a',
          card: '#1e293b',
          border: '#334155',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        codearena: {
          "primary": "#0ea5e9",
          "primary-content": "#ffffff",
          "secondary": "#6366f1",
          "secondary-content": "#ffffff",
          "accent": "#22d3ee",
          "accent-content": "#000000",
          "neutral": "#1e293b",
          "neutral-content": "#a6adbb",
          "base-100": "#0f172a",
          "base-200": "#0a0f1a",
          "base-300": "#1e293b",
          "base-content": "#ffffff",
          "info": "#38bdf8",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
    ],
    darkTheme: "codearena",
  },
}
