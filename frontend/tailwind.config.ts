import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#171520',
        ink2: '#3A3550',
        muted: '#7E7A93',
        faint: '#B6B2C7',
        line: '#ECE9F1',
        paper: '#F6F4F0',
        cream: '#FBF8F2',
        indigo: { DEFAULT: '#4B3FD6', soft: '#ECE9FB', 2: '#6C5CE7' },
        coral: { DEFAULT: '#FF6B5E', soft: '#FFE9E6' },
        trust: { DEFAULT: '#1E9E63', soft: '#E4F5EC' },
        amber: { DEFAULT: '#E89611', soft: '#FCF1DC' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 14px 34px rgba(30,22,70,.10)',
        card: '0 3px 10px rgba(30,22,70,.04)',
      },
    },
  },
  plugins: [],
};
export default config;
