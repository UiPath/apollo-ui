/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Apollo Design System colors based on apollo-core tokens
        primary: {
          DEFAULT: '#0066CC',
          500: '#0066CC',
        },
        secondary: {
          DEFAULT: '#6C757D',
          500: '#6C757D',
        },
        success: {
          DEFAULT: '#28A745',
          500: '#28A745',
        },
        error: {
          DEFAULT: '#DC3545',
          500: '#DC3545',
        },
        warning: {
          DEFAULT: '#FFC107',
          500: '#FFC107',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
  },
  plugins: [],
};
