const plugin = require('tailwindcss/plugin')

module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        goldenrod: 'goldenrod',
        wheat: 'wheat',
        'mastery7-blue': '#102b58',
        'mastery7-blue-secondary': '#204b85',
        'mastery6-violet': '#582263',
        'mastery6-violet-secondary': '#73407e',
        'mastery5-red': '#672121',
        'mastery5-red-secondary': 'firebrick',
        'mastery4-brown': '#725a34',
        'mastery4-brown-secondary': '#9e7a39',
        'mastery-beige': '#b59458',
      },
      backgroundImage: {
        landing: "url('./imgs/bg-landing.jpg')",
      },
      textShadow: {
        DEFAULT: '0 0 5px var(--tw-shadow-color)',
      },
      animation: {
        glow: 'glow 1s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': {
            transform: 'scale(1) rotate(0deg)',
          },
          '50%': {
            transform: 'scale(1.05) rotate(180deg)',
          },
          '100%': {
            transform: 'scale(1) rotate(360deg)',
          },
          /* ping and spin */
          //   '0%': {
          //     transform: 'scale(1) rotate(0deg)',
          //     opacity: 1,
          //   },
          //   '75%': {
          //     transform: 'scale(1.2) rotate(270deg)',
          //     opacity: 0,
          //   },
          //   '100%': {
          //     transform: 'scale(1.2) rotate(360deg)',
          //     opacity: 0,
          //   },
        },
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        { 'text-shadow': textShadow => ({ textShadow }) },
        { values: theme('textShadow') },
      )
    }),
  ],
}
