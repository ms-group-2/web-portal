/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7776EA',
          50: '#f2f2fe',
          100: '#e5e5fc',
          200: '#cccbf9',
          300: '#b3b0f5',
          400: '#9995f0',
          500: '#7776EA',
          600: '#664bb3',
          700: '#593ea6',
          800: '#4d3299',
          900: '#341a7f',
        },
        accent: '#7A1DFF',
        swap: '#FAAF78',
        market: '#80CBC4',
        booking: '#3E5AD8',
      },
    },
  },
  plugins: [],
};