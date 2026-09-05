/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          navy: '#1E3A5F',
          steel: '#3F5F7F',
          bg: '#F8F9FA',
          sidebar: '#1E3A5F',
          card: '#FFFFFF',
          text: '#1F2937',
          muted: '#64748B',
          subtle: '#94A3B8',
          border: '#E2E8F0',
          success: '#2E7D5B',
          warning: '#B7791F',
          danger: '#B42318',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
