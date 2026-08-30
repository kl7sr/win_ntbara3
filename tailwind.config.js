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
          50: '#e6f5ed',
          100: '#c2e6d2',
          500: '#006633', // Official Algerian Green (PMS 356 / RGB 0, 102, 51)
          600: '#005229',
          700: '#003d1f',
          800: '#002914',
          900: '#00140a',
        },
        dzRed: {
          50: '#fdedf0',
          100: '#fad3da',
          500: '#D21034', // Official Algerian Red (PMS 186 / RGB 210, 16, 52)
          600: '#b80e2d',
          700: '#940b24',
          800: '#70091c',
          900: '#4c0613',
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
