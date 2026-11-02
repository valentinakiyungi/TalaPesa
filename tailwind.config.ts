import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf4',
          100: '#d8f3e3',
          200: '#b3e6ca',
          300: '#80d2aa',
          400: '#4bb784',
          500: '#279b68',
          600: '#187d53',
          700: '#136445',
          800: '#125038',
          900: '#0f4230',
          950: '#07251b',
        },
        ink: {
          50: '#f6f7f6',
          100: '#e3e6e4',
          200: '#c6ccc8',
          300: '#a1aba5',
          400: '#7c8880',
          500: '#616d66',
          600: '#4c5650',
          700: '#3f4742',
          800: '#353b37',
          900: '#1f2421',
          950: '#121513',
        },
        gold: { 400: '#f2b84b', 500: '#e29b22', 600: '#c47b13' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,20,.04), 0 1px 3px rgba(16,24,20,.06)',
      },
    },
  },
  plugins: [],
};

export default config;
