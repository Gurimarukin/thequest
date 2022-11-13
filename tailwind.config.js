const plugin = require('tailwindcss/plugin')

module.exports = {
  mode: 'jit',
  content: ['./src/client/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        goldenrod: 'goldenrod',
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
