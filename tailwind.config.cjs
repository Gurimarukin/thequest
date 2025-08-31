const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}', './uibook/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    fontFamily: {
      baloo: 'baloo2',
      'lib-mono': 'liberationMono',
    },
    colors: {
      black: 'black',
      current: 'currentColor',
      transparent: 'transparent',
      white: 'white',

      'cyan-200': colors.cyan[200],
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
      'wheat-bis': '#c8ab6d',
      'zinc-400': colors.zinc[400],
      'zinc-700': colors.zinc[700],
      'zinc-900': colors.zinc[900],
      'zinc-950': colors.zinc[950],

      'green-toaster': 'forestgreen',
      'green-toaster-bis': 'darkgreen',
      'red-toaster': '#b51414',
      'red-toaster-bis': 'darkred',
      tooltip: '#725a34',
      'aram-stats': colors.zinc[800],
      'histogram-grey': colors.gray[600],

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
      gridArea: {
        1: '1 / 1', // useful for superposing multiple elements in a grid element
      },
      // https://v3.tailwindcss.com/docs/theme#spacing
      spacing: {
        13.5: '3.375rem',
      },
      fontSize: {
        '2xs': ['.625rem', { lineHeight: '0.75rem' }],
      },
      lineHeight: {
        2.5: '.625rem',
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
    /**
     * Plugin for grid-area:
     * - `area-{name}`: define grid-area (customize in theme)
     */
    plugin(({ matchUtilities, theme }) =>
      matchUtilities({ area: gridArea => ({ gridArea }) }, { values: theme('gridArea') }),
    ),

    /**
     * Plugin for text-shadow:
     * - `text-shadow-{name}`: add some text-shadow (customize in theme)
     * - `shadow-{color}`: text-shadow color
     */
    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        { 'text-shadow': textShadow => ({ textShadow }) },
        { values: theme('textShadow') },
      ),
    ),
  ],
}
