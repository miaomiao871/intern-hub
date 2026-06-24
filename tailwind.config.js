/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FBEAF0',
          100: '#F4C0D1',
          200: '#ED93B1',
          300: '#E5729A',
          400: '#D4537E',
          500: '#B8446A',
          600: '#993556',
          700: '#72243E',
          800: '#4B1528',
          900: '#2D0C17',
        },
      },
      fontFamily: {
        cute: ['Nunito', '"M PLUS Rounded 1c"', 'Inter', 'PingFang SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
};
