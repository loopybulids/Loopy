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
        // ── Admin console only ───────────────────────────────────────
        // The admin is a separate tool for Loopy's own staff, so it uses a
        // cool slate palette rather than the storefront's navy + green. Kept
        // as its own tokens (not an override of the brand ones) so changing
        // the admin can never retint a seller's storefront.
        // Low contrast on purpose. A near-black sidebar against a near-white
        // page put the loudest edge in the layout between two things that are
        // only furniture; the sidebar is now a shade of the page rather than
        // its opposite, and the accent is desaturated so the numbers carry
        // the screen instead of the chrome.
        slate: '#2A3341',      // body text
        slateink: '#FFFFFF',   // sidebar — white chrome
        cool: '#F5F6F8',       // page ground — grey, so white cards lift off it
        hair: '#E7E9ED',       // borders
        dim: '#6B7683',        // secondary text
        pale: '#9AA3AE',       // tertiary text
        // Fresh green accent, used sparingly: primary actions, the active nav
        // item, positive figures. Deeper than a pure #22C55E so it still
        // passes contrast as small text on white, which the brighter value
        // does not.
        accent: { DEFAULT: '#1EA75B', 600: '#17864A', soft: '#EAF7F0' },
        alert: { DEFAULT: '#B4554C', soft: '#F9EEEC' },
        warn: { DEFAULT: '#9A7B37', soft: '#F7F2E7' },

        paper: '#F6F5F0',
        cream: '#FBFAF6',
        line: '#E8E6DE',
        muted: '#5B6577',
        faint: '#9AA2B1',
        amber: { DEFAULT: '#E89611', soft: '#FBF1DC' },
        rose: { DEFAULT: '#E14B3C', soft: '#FCEAE8' },
      },
      fontFamily: {
        // One typeface across body and headings — matches the reference design's
        // dashboard typography. Weight, not family, sets hierarchy.
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Headings. A different voice from the body face on purpose.
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        // Figures. Fixed-width digits so money lines up down a column.
        num: ['var(--font-num)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
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
