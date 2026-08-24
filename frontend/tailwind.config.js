/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        darkCard: '#151c2c',
        darkBorder: '#222f47',
        brandPrimary: '#3b82f6',
        brandSecondary: '#10b981',
      }
    },
  },
  plugins: [],
}
