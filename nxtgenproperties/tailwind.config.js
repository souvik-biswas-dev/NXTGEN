/** @type {import('tailwindcss').Config} */

// Kept in sync with constants/theme.ts. Change the value there and mirror it
// here — tailwind config can't import from TS files during PostCSS compile.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        'primary-container': '#FFDBC9',
        secondary: '#1B2838',
        'secondary-container': '#D5DDE7',
        surface: '#FFFBFF',
        'surface-variant': '#F5DED1',
        'card-bg': '#FFF3EC',
        outline: '#84746A',
        'outline-variant': '#D7C3B8',
        success: '#10B981',
        gold: '#F59E0B',
        // Keep a neutral gray scale for utility classes that aren't in theme.ts.
        gray: {
          50: '#F8F9FA',
          100: '#E9ECEF',
          200: '#DEE2E6',
          300: '#CED4DA',
          400: '#ADB5BD',
          500: '#6C757D',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#1A1A1A',
        },
      },
      fontFamily: {
        poppins: ['Poppins'],
        'poppins-bold': ['Poppins-Bold'],
        'poppins-medium': ['Poppins-Medium'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '28px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
