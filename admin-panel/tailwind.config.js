/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Same palette as the mobile app: teal / navy / gold.
        primary: '#0F766E',
        navy: '#1B2838',
        gold: '#D4A24C',
        success: '#10B981',
        ink: '#0B1015',
        panel: '#121A22',
        panel2: '#18222C',
        line: '#243140',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
