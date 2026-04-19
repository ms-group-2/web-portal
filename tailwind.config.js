/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          50: '#f2f2fe',
          100: '#e5e5fc',
          200: '#cccbf9',
          300: '#b3b0f5',
          400: '#9995f0',
          600: '#664bb3',
          700: '#593ea6',
          800: '#4d3299',
          900: '#341a7f',
        },
        accent: 'var(--color-accent)',
        swap: 'var(--color-swap)',
        swapPost: 'var(--color-swapPost)',
        booking: {
          DEFAULT: 'var(--color-booking)',
          light: 'var(--color-booking-light)',
        },
        market: 'var(--color-market)',
        textBlue: 'var(--color-textBlue)',
        background: 'var(--color-background)',
        backgroundIcon: 'var(--color-backgroundIcon)',
        borderColor: 'var(--color-borderColor)',
        registerBusiness: 'var(--color-registerBusiness)',
        vendorPageBackground: 'var(--color-vendorPageBackground)',
        categories: 'var(--color-categories)',
      },
      screens: {
        '2xl': '1440px',
      },
      maxWidth: {
        '2xl': '1400px',
      },
    },
  },
  plugins: [],
};