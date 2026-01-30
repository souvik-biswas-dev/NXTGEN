/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B35',
        secondary: '#2E86AB',
        success: '#27AE60',
        background: '#F8F9FA',
        dark: '#1A1A1A',
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
          900: '#1A1A1A'
        }
      },
      fontFamily: {
        'poppins': ['Poppins'],
        'poppins-bold': ['Poppins-Bold'],
        'poppins-medium': ['Poppins-Medium']
      }
    },
  },
  darkMode: 'class',
  plugins: [],
}
