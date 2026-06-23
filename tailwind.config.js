/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F4F6F0',
          100: '#E9EDE2',
          200: '#C5CFB5',
          300: '#A1B288',
          400: '#8A9A6E',
          500: '#6B7F4A',
          600: '#5A6C3E',
          700: '#495832',
          800: '#384426',
          900: '#27301A',
        },
        warm: {
          50: '#FAF9F6',
          100: '#F5F4F1',
          200: '#EDEBE7',
          300: '#E2E0DC',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"PMingLiU"', '"Songti TC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans TC"', '"PingFang TC"', '"Microsoft JhengHei"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
