/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'benne': {
          cream: '#F5F3F0',
          gold: '#C8963E',
          'gold-dark': '#B08535',
          brown: '#1A1A1A',
          'brown-muted': '#4A4A4A',
          border: '#E5E3E0',
          'border-light': '#F0EDE8',
        }
      },
      fontFamily: {
        'serif': ['Playfair Display', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
