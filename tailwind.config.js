/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#171111', // Darker background from website
        'card-bg': '#322525', // Card background from website
        'accent': '#d6221f', // Brand red from website
        'brand-border': '#000000', // Border color for neobrutalism
        'brand-foreground': '#ffffff', // Primary text color
        'brand-muted': '#b8cce0', // Muted text color
      },
      borderRadius: {
        'base': '6px', // Base radius from website's neobrutalism theme
      },
      boxShadow: {
        'neo': '4px 4px 0px #000', // The signature neobrutalism shadow
      },
      spacing: {
        'neo': '4px', // The translation distance for hover effects
      },
    },
  },
  plugins: [],
}