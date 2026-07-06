/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          800: '#1a2744',
          900: '#0f1a33',
          950: '#080e1f',
        },
        gold: {
          300: '#f0d080',
          400: '#e8c060',
          500: '#c9a227',
          600: '#a8841f',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
