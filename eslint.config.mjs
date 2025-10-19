import { fixupPluginRules } from '@eslint/compat'
import js from '@eslint/js'
import fpTs_ from 'eslint-plugin-fp-ts'
import functional from 'eslint-plugin-functional'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'

const fpTs = fixupPluginRules(fpTs_)

export default tseslint.config(
  { ignores: ['src/**/libs/**/*.ts', 'src/**/libs/**/*.tsx'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      functional.configs.strict,
      ...tailwindcss.configs['flat/recommended'],
    ],
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: 'tsconfig.json',
      },
      parserOptions: {
        projectService: true,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'fp-ts': fpTs,
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...fpTs.configs.all.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,

      '@typescript-eslint/array-type': ['warn', { default: 'array', readonly: 'generic' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', disallowTypeAnnotations: false },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/no-base-to-string': [
        'error',
        {
          ignoredTypeNames: [
            'AccessToken',
            'ChallengeId',
            'ChampionEnglishName',
            'ChampionId',
            'ChampionKey',
            'DDragonVersion',
            'DiscordUserId',
            'GameId',
            'GameName',
            'ItemId',
            'MsDuration',
            'Puuid',
            'SummonerName',
            'SummonerSpellId',
            'SummonerSpellKey',
            'TagLine',
            'UserId',
            'UserName',
          ],
        },
      ],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-restricted-imports': 'off',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      'arrow-parens': ['warn', 'as-needed'],
      'arrow-body-style': ['warn', 'as-needed'],
      'array-callback-return': 'off',
      'comma-dangle': [
        'warn',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'always-multiline',
          functions: 'always-multiline',
        },
      ],
      eqeqeq: ['error', 'always'],
      'fp-ts/no-module-imports': ['warn', { allowTypes: true }],
      'functional/functional-parameters': [
        'error',
        {
          allowRestParameter: true,
          enforceParameterCount: false,
        },
      ],
      'functional/no-conditional-statements': 'off', // switch aren't bad :/
      'functional/no-expression-statements': [
        'warn',
        {
          ignoreCodePattern: [
            '^afterEach\\(',
            '^beforeEach\\(',
            '^console\\.',
            '^describe(\\.only)?\\(',
            '^expectT(\\.only)?\\(',
            '^it(\\.only)?\\(',
            '^useEffect\\(',
          ],
        },
      ],
      'functional/no-mixed-types': 'off',
      'functional/no-return-void': ['error', { ignoreInferredTypes: true }],
      'functional/prefer-immutable-types': 'off',
      'functional/type-declaration-immutability': 'off',
      'max-len': [
        'warn',
        {
          code: 100,
          tabWidth: 2,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
      'no-console': 'off',
      'no-else-return': ['warn', { allowElseIf: false }],
      'no-empty-function': 'off',
      'no-empty-pattern': 'off',
      'no-inner-declarations': 'off',
      'no-irregular-whitespace': 'off',
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      'no-multi-spaces': 'off',
      'no-redeclare': 'off',
      'no-restricted-imports': 'off',
      'no-shadow': ['warn', { hoist: 'functions' }],
      'no-undef': 'off',
      'no-unneeded-ternary': 'warn',
      'no-use-before-define': 'off',
      'no-useless-computed-key': 'warn',
      'no-useless-rename': 'warn',
      'nonblock-statement-body-position': ['warn', 'beside'],
      'object-shorthand': 'warn',
      'prettier/prettier': 'off',
      quotes: ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'react/button-has-type': 'warn',
      'react/display-name': 'off',
      'react/hook-use-state': 'warn',
      'react/jsx-boolean-value': ['warn', 'always'],
      'react/jsx-no-bind': [
        'warn',
        {
          ignoreDOMComponents: false,
          ignoreRefs: false,
          allowArrowFunctions: false,
          allowFunctions: false,
          allowBind: false,
        },
      ],
      'react/no-array-index-key': 'warn',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/self-closing-comp': ['warn', { component: true, html: true }],
      'sort-imports': [
        'warn',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
      'space-in-parens': ['warn', 'never'],
      strict: 'warn',
      'tailwindcss/no-custom-classname': 'warn',
    },
  },
)
