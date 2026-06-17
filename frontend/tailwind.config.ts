import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: deep navy + emerald on warm off-white (from reference designs)
        navy: { DEFAULT: '#0E2A47', deep: '#091B2E', 700: '#143A5E', 600: '#1B4B79' },
        ink: '#0E2A47',
        green: { DEFAULT: '#15784A', 600: '#1E9E63', 500: '#22C55E', mint: '#86EFAC', soft: '#E3F6EC' },
        paper: '#F6F5F0',
        cream: '#FBFAF6',
        line: '#E8E6DE',
        muted: '#5B6577',
        faint: '#9AA2B1',
        amber: { DEFAULT: '#E89611', soft: '#FBF1DC' },
        rose: { DEFAULT: '#E14B3C', soft: '#FCEAE8' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-jakarta)', 'var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 40px -12px rgba(14,42,71,.18)',
        card: '0 2px 10px rgba(14,42,71,.05)',
        lift: '0 24px 60px -18px rgba(14,42,71,.28)',
        glow: '0 0 0 4px rgba(34,197,94,.18)',
      },
      keyframes: {
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-14px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        pulseRing: { '0%': { transform: 'scale(.9)', opacity: '.7' }, '70%,100%': { transform: 'scale(2.2)', opacity: '0' } },
        aurora: { '0%,100%': { transform: 'translate(0,0) scale(1)' }, '33%': { transform: 'translate(8%,-6%) scale(1.15)' }, '66%': { transform: 'translate(-6%,5%) scale(.95)' } },
        dash: { to: { strokeDashoffset: '0' } },
        gradientPan: { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        riseIn: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        tickerGlow: { '0%,100%': { opacity: '.5' }, '50%': { opacity: '1' } },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        marquee: 'marquee 30s linear infinite',
        spinSlow: 'spinSlow 14s linear infinite',
        pulseRing: 'pulseRing 2.4s ease-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        gradientPan: 'gradientPan 8s ease-in-out infinite',
        riseIn: 'riseIn .6s cubic-bezier(.22,1,.36,1) both',
        tickerGlow: 'tickerGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
