import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper:   '#F3EEE3',
        ink:     '#1C1A17',
        accent:  '#B54A2C',
        gold:    '#9C7C3E',
        coral:   '#B54A2C',
        muted:   '#7C7568',
        surface: '#FFFFFF',
      },
      fontFamily: {
        serif:  ['Source Serif 4', 'Georgia', 'serif'],
        sans:   ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        bebas:  ['Bebas Neue', 'Impact', 'sans-serif'],
      },
      fontSize: {
        'hero':    ['40px', { lineHeight: '1.1' }],
        'section': ['26px', { lineHeight: '1.2' }],
        'card':    ['16px', { lineHeight: '1.3' }],
        'stat':    ['28px', { lineHeight: '1' }],
        'label':   ['10px', { lineHeight: '1', letterSpacing: '0.1em' }],
      },
      borderColor: {
        DEFAULT: 'rgba(26,26,26,0.10)',
      },
      backgroundImage: {
        'grid-lines': `repeating-linear-gradient(
          0deg,
          rgba(28,26,23,0.04) 0px,
          rgba(28,26,23,0.04) 1px,
          transparent 1px,
          transparent 36px
        )`,
      },
    },
  },
  plugins: [],
}

export default config
