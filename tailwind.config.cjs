const colors = require('tailwindcss/colors')
const plugin = require('tailwindcss/plugin')

/**
 * | rem  | x4 = name | x4 = px |
 * | ---- | --------- | ------- |
 * | 1rem | 4         | 16px    |
 *
 * rem = px / 16
 */

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
      beige: 'beige',
      tooltip: '#725a34',
      'aram-stats': colors.zinc[800],
      'histogram-grey': colors.gray[600],

      'poro-red': '#cd4545', // #e9422e // (poro colors)
      'poro-orange': '#cd8837', // #fac552
      'poro-green': '#149c3a', // #3cbc8d
      'poro-blue': '#25acd6', // #2796bc

      'discord-blurple': '#5865f2',
      'discord-darkgreen': '#248045',
      'discord-darkgrey': '#2b2d31',
      'discord-green': '#57f287',
      'discord-red': '#ed4245',
    },
    borderRadius: {
      none: '0px',
      sm: '0.125rem', // 2px
      DEFAULT: '0.25rem', // 4px
      5: '0.3125rem', // 5px
      md: '0.375rem', // 6px
      lg: '0.5rem', // 8px
      xl: '0.75rem', // 12px
      '2xl': '1rem', // 16px
      '3xl': '1.5rem', // 24px
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
        0.75: '.1875rem', // 3px
        1.25: '.3125rem', // 5px
        1.75: '.4375rem', // 7px
        3.75: '.9375rem', // 15px
        4.5: '1.125rem', // 18px
        5.5: '1.375rem', // 22px
        7.5: '1.875rem', // 30px
        9.75: '2.4375rem', // 39pxx
        13.5: '3.375rem', // 54px
        17: '4.25rem', // 68px
        19.5: '4.875rem', // 78px
        32.5: '8.125rem', // 130px
        41: '10.25rem', // 164px
        50: '12.5rem', // 200px
        84: '21rem', // 336px
        96: '24rem', // 384px
        125: '31.25rem', // 500px
        416: '104rem', // 1664px
      },
      maxWidth: {
        screen: '100vw',
      },
      borderWidth: {
        3: '0.1875rem', // 3px
      },
      fontSize: {
        '2xs': [
          '.625rem', // 10px
          { lineHeight: '.75rem' }, // 12px
        ],
        15: [
          '.9375rem', // 15px
          { lineHeight: '.5625rem' }, // 9px
        ],
      },
      lineHeight: {
        2.5: '.625rem', // 10px
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

    plugin(({ matchUtilities, theme }) =>
      matchUtilities(
        { secondary: color => ({ '--secondary-color': color }) },
        { type: ['color'], values: theme('colors') },
      ),
    ),

    plugin(({ addComponents }) =>
      addComponents({
        '.sr-only': {
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        },
      }),
    ),
  ],
}
