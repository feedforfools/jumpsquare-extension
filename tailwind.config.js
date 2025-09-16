/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a1a',
        'card-bg': '#2a2a2a',
        'accent': '#ff6b35'
      }
    },
  },
  plugins: [],
}