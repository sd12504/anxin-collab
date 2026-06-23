/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F2F5ED',
          100: '#E4EAD8',
          200: '#C5D3AE',
          300: '#A3BB81',
          400: '#849E5C',
          500: '#6B8343',
          600: '#556934',
          700: '#425127',
          800: '#2F3A1C',
          900: '#1D2411',
        },
        beige: {
          50: '#FCFAF6',
          100: '#F8F4EC',
          200: '#F0E8D5',
          300: '#E5D7B8',
          400: '#D4C09A',
          500: '#C0A87C',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F5F4F1',
          200: '#EDEBE7',
          300: '#E2E0DC',
        },
        sidebar: {
          DEFAULT: '#1a2233',
          50: '#2a3448',
          100: '#242e40',
          200: '#1e2737',
          300: '#1a2233',
          400: '#161d2b',
          500: '#121823',
          600: '#0e131c',
          700: '#0a0e14',
          800: '#06090d',
          900: '#030406',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"PMingLiU"', '"Songti TC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
