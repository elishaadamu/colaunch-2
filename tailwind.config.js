/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Roboto"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // 10% Accent Color: CoLaunch Brand Red
        brand: {
          DEFAULT: '#C81E3C',
          hover: '#B01732',
          active: '#99142B',
          light: '#FF4D6D',
          subtle: 'rgba(200, 30, 60, 0.15)',
          border: 'rgba(200, 30, 60, 0.35)',
        },
        // 60% Dominant & 30% Secondary Palette
        studio: {
          bg: '#090D16',       // 60% Dominant backdrop
          card: '#0D121F',     // 30% Secondary card foundation
          surface: '#131929',  // 30% Elevated panel
          border: '#1E293B',   // 30% Structural border
          muted: '#94A3B8',    // 30% Muted slate text
          heading: '#F8FAFC',  // High contrast white text
        },
        obsidian: {
          DEFAULT: '#090D16',
          subtle: '#0D121F',
          card: '#131929',
          elevated: '#1A2236',
          border: '#1E293B',
        },
        forge: {
          bg: '#090D16',
          surface: '#0D121F',
          card: '#131929',
          hover: '#1A2236',
          border: '#1E293B',
          'border-light': '#334155',
          text: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          lime: '#C81E3C',
          'lime-dark': '#B01732',
          'lime-glow': 'rgba(200, 30, 60, 0.2)',
          positive: '#78E08F',
        }
      },
      borderRadius: {
        'none': '0px',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'scan': 'scan 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-up': 'slideInUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%, 100%': { transform: 'translateY(-50%) scaleX(0.6)', opacity: '0.3' },
          '50%': { transform: 'translateY(50%) scaleX(1)', opacity: '0.8' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
