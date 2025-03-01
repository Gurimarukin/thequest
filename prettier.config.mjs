export default {
  endOfLine: 'lf',
  printWidth: 100,
  semi: false,
  singleQuote: true,
  trailingComma: 'all',
  arrowParens: 'avoid',
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^(\\.?\\.\\/)+(src/)?shared/(.*)$',
    '^(\\.?\\.\\/)+(src/)?client/(.*)$',
    '^(\\.?\\.\\/)+(src/)?server/(.*)$',
    '^\\.(?!.*\\.css$)',
    '\\.css$',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
}
