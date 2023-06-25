const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    colors: {
      black: 'black',
      current: 'currentColor',
      transparent: 'transparent',
      white: 'white',

      goldenrod: 'goldenrod',
      'goldenrod-bis': '#b58703',
      green: colors.green[600],
      'grey-400': colors.gray[400],
      'grey-500': colors.gray[500],
      'grey-disabled': colors.zinc[600],
      red: colors.red[600],
      'red-ban': colors.red[800],
      slate: colors.slate[900],
      'slate-dark': colors.slate[950],
      wheat: 'wheat',
      'wheat-bis':  '#c8ab6d',
      'zinc-400': colors.zinc[400],
      'zinc-700': colors.zinc[700],
      'zinc-900': colors.zinc[900],
      'zinc-950': colors.zinc[950],

      'aram-stats': colors.zinc[800],
      'histogram-grey': colors.gray[600],
      'mastery-3': '#71717a',
      'mastery-3-bis': '#52525b', // #52604f
      'mastery-3-text': colors.neutral[300],
      'mastery-4': '#9e7a39',
      'mastery-4-bis': '#725a34',
      'mastery-4-text': colors.yellow[600],
      'mastery-5': '#771616', // firebrick
      'mastery-5-bis': '#672121',
      'mastery-5-text': colors.red[700],
      'mastery-6': '#73407e',
      'mastery-6-bis': '#582263',
      'mastery-6-text': colors.purple[400],
      'mastery-7': '#204b85',
      'mastery-7-bis': '#043c88',
      'mastery-7-text': colors.blue[500],
      tooltip: '#725a34',

      'discord-blurple': '#5865f2',
      'discord-darkgreen': '#248045',
      'discord-darkgrey': '#2b2d31',
      'discord-green': '#57f287',
      'discord-red': '#ed4245',
    },
    extend: {
      data: {
        'popper-top': "popper-placement^='top'",
        'popper-bottom': "popper-placement^='bottom'",
        'popper-left': "popper-placement^='left'",
        'popper-right': "popper-placement^='right'",
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
        'my-spin': 'spin 40s linear infinite',
        'my-spin-reverse': 'spin 10s linear infinite reverse',
        dice: 'dice 2s ease-in-out infinite',
      },
      keyframes: {
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
