/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0f1e',
          800: '#0d1526',
          700: '#111d35',
          600: '#162040',
          500: '#1e2d4f',
        },
        brand: {
          blue:  '#3b82f6',
          indigo: '#6366f1',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
