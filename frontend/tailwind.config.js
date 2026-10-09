/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cb: {
          bg: 'var(--bg)',
          surface: 'var(--surface)',
          surface2: 'var(--surface-2)',
          border: 'var(--border)',
          borderStrong: 'var(--border-strong)',
          text: 'var(--text)',
          textMuted: 'var(--text-muted)',
          textFaint: 'var(--text-faint)',
          coral: 'var(--accent)',
          mint: 'var(--accent-2)',
          critical: 'var(--status-critical)',
          warning: 'var(--status-warning)',
          success: 'var(--status-success)',
          info: 'var(--status-info)',
        },
        // Direct palette aliases
        coral: {
          DEFAULT: '#FF6242',
          glow: 'rgba(255, 98, 66, 0.22)',
          hover: '#FF7B60',
        },
        mint: {
          DEFAULT: '#55D6A2',
          glow: 'rgba(85, 214, 162, 0.22)',
          hover: '#6FE0B2',
        },
        cinematic: {
          bg: '#050505',
          card: 'rgba(255, 255, 255, 0.04)',
          card2: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(245, 242, 237, 0.12)',
          borderStrong: 'rgba(245, 242, 237, 0.24)',
          text: '#F5F2ED',
          muted: 'rgba(245, 242, 237, 0.68)',
          faint: 'rgba(245, 242, 237, 0.48)',
        },
        clinical: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
        }
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'card': '16px',
        'control': '12px',
      },
      boxShadow: {
        'delicate': '0 20px 60px rgba(0, 0, 0, 0.45)',
        'glow-coral': '0 0 24px rgba(255, 98, 66, 0.22)',
        'glow-coral-lg': '0 0 32px rgba(255, 98, 66, 0.35)',
        'glow-coral-xl': '0 0 45px rgba(255, 98, 66, 0.45)',
        'glow-mint': '0 0 24px rgba(85, 214, 162, 0.22)',
        'card-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      letterSpacing: {
        'tight-syne': '-0.02em',
        'wide-mono': '0.12em',
      },
      animation: {
        'spin-slow': 'spin 90s linear infinite',
        'spin-reverse': 'spinReverse 140s linear infinite',
        'emblem-float': 'emblemFloat 8s ease-in-out infinite alternate',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'rise-in': 'riseIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        spinReverse: {
          'from': { transform: 'rotate(360deg)' },
          'to': { transform: 'rotate(0deg)' },
        },
        emblemFloat: {
          '0%': { transform: 'translateY(0px)' },
          '100%': { transform: 'translateY(8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', filter: 'drop-shadow(0 0 8px rgba(255, 98, 66, 0.4))' },
          '50%': { opacity: '0.95', filter: 'drop-shadow(0 0 20px rgba(255, 98, 66, 0.8))' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
