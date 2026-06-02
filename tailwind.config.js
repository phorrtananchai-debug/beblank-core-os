/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        ivory: '#fff9ef',
        graphite: '#2a2723',
        accent: '#b66f3e',
      },
    },
  },
  plugins: [],
}

