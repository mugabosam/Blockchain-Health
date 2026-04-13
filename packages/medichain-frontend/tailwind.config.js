/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0b1326',
          dim: '#0b1326',
          bright: '#31394d',
          tint: '#4edea3',
          variant: '#2d3449',
          container: {
            DEFAULT: '#171f33',
            lowest: '#060e20',
            low: '#131b2e',
            high: '#222a3d',
            highest: '#2d3449',
          },
        },
        primary: {
          DEFAULT: '#4edea3',
          container: '#10b981',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
        },
        secondary: {
          DEFAULT: '#adc6ff',
          container: '#0566d9',
          fixed: '#d8e2ff',
          'fixed-dim': '#adc6ff',
        },
        tertiary: {
          DEFAULT: '#ffb3ad',
          container: '#ff7a73',
          fixed: '#ffdad7',
          'fixed-dim': '#ffb3ad',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        outline: {
          DEFAULT: '#86948a',
          variant: '#3c4a42',
        },
        background: '#0b1326',
        'on-primary': '#003824',
        'on-primary-container': '#00422b',
        'on-secondary': '#002e6a',
        'on-secondary-container': '#e6ecff',
        'on-tertiary': '#68000a',
        'on-tertiary-container': '#79000e',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#bbcabf',
        'on-background': '#dae2fd',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        'inverse-surface': '#dae2fd',
        'inverse-on-surface': '#283044',
        'inverse-primary': '#006c49',
      },
      fontFamily: {
        headline: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        label: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.5s ease-out forwards',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
}
