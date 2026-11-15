/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2F8',
          100: '#DCE6F5',
          700: '#1B3560',
          800: '#14284B',
          900: '#0F1F3D',
        },
        emerald: {
          100: '#D1FAE5',
          500: '#10B981',
          700: '#047857',
          800: '#065F46',
        },
        page: '#F7F9FB',
        surface: '#FFFFFF',
        grey: {
          50: '#F1F4F8',
          200: '#E2E8F0',
          400: '#94A3B8',
          500: '#64748B',
          700: '#334155',
        },
        danger: {
          DEFAULT: '#B42318',
          text: '#B42318',
          bg: '#FEE2E2',
        },
        warning: {
          DEFAULT: '#92400E',
          text: '#92400E',
          bg: '#FEF3C7',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(15, 31, 61, 0.05), 0 1px 2px 0 rgba(15, 31, 61, 0.03)',
      },
    },
  },
  plugins: [],
};
