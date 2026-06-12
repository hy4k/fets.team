import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fets: {
          bg:        '#040A08',
          card:      '#0C1A16',
          sidebar:   '#06100D',
          border:    '#1B2A22',
          yellow:    '#C9A35C',
          'yellow-hover': '#E2C285',
          text:      '#EDEFE9',
          secondary: '#A9B5A9',
          muted:     '#66756A',
          subtle:    '#3D4B42',
        },
        brass: {
          300: '#F0DCAE', 400: '#E2C285', 500: '#C9A35C', 600: '#A87F3D', 700: '#8A6630',
        },
        aurora: {
          300: '#99F6E4', 400: '#5EEAD4', 500: '#2DD4BF', 600: '#14B8A6', 700: '#0D9488',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { transform: 'translateX(-10px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}

export default config
