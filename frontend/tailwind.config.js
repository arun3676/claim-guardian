/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Clinical FinTech color palette
        'medical-primary': '#0d9488', // Deep rich teal
        'medical-accent': '#10b981', // Vibrant professional emerald
        'surface': '#fafafa', // App background (zinc-50)
        'card': '#ffffff', // Card background with subtle borders
      },
      fontFamily: {
        sans: ['Inter', 'Geist Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
