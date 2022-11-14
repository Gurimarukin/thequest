const plugin = require('tailwindcss/plugin')

module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        goldenrod: 'goldenrod',
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
