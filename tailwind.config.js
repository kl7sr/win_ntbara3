/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dzGreen: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#006233',
          600: '#00522b',
          700: '#004222',
        },
        dzRed: {
          50: '#fff1f2',
          500: '#D21034',
          600: '#b90e2d',
          700: '#9f0b26',
        },
        emergency: {
          amber: '#F59E0B',
          red: '#EF4444',
          blue: '#3B82F6',
        }
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
