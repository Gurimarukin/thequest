const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      data: {
        'popper-top': "popper-placement^='top'",
        'popper-bottom': "popper-placement^='bottom'",
        'popper-left': "popper-placement^='left'",
        'popper-right': "popper-placement^='right'",
      },
      colors: {
        goldenrod: 'goldenrod',
        'goldenrod-secondary': '#b58703',
        wheat: 'wheat',
        'mastery7-blue': '#204b85',
        'mastery7-blue-secondary': '#043c88',
        'mastery6-violet': '#73407e',
        'mastery6-violet-secondary': '#582263',
        'mastery5-red': '#771616', // firebrick
        'mastery5-red-secondary': '#672121',
        'mastery4-brown': '#9e7a39',
        'mastery4-brown-secondary': '#725a34',
        'mastery-beige': '#52525b',
        'discord-blurple': '#5865f2',
        'discord-green': '#57f287',
        'discord-red': '#ed4245',
        'discord-darkgreen': '#248045',
        'discord-darkgrey': '#2b2d31',
      },
      backgroundImage: {
        landing: "url('./imgs/bg-landing.jpg')",
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      boxShadow: {
        even: '0 0 8px 0 var(--tw-shadow-color)',
      },
      textShadow: {
        DEFAULT: '0 0 5px var(--tw-shadow-color)',
      },
      borderRadius: {
        '1/2': '50%',
      },
      animation: {
        glow: 'glow 1s ease-in-out infinite',
        dice: 'dice 2s ease-in-out infinite',
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
        },
        dice: {
          '0%': {
            transform: 'rotate(0deg)',
          },
          '33%': {
            transform: 'rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(720deg)',
          },
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
