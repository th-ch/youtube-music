module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
  ],
  plugins: ['import'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'arrow-parens': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-default-export': 'off',
    'import/no-duplicates': 'error',
    'import/order': [
      'error',
      {
        'groups': ['builtin', 'external', ['internal', 'index', 'sibling'], 'parent', 'type'],
        'newlines-between': 'always-and-inside-groups',
        'alphabetize': {order: 'ignore', caseInsensitive: false}
      }
    ],
    'import/prefer-default-export': 'off',
    'camelcase': ['error', {properties: 'never'}],
    'class-methods-use-this': 'off',
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: false,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
      },
    ],
    'max-len': 'off',
    'no-mixed-operators': 'error',
    'no-multi-spaces': ['error', {ignoreEOLComments: true}],
    'no-tabs': 'error',
    'no-void': 'error',
    'no-empty': 'off',
    'prefer-promise-reject-errors': 'off',
    'quotes': ['error', 'single', {
      avoidEscape: true,
      allowTemplateLiterals: false,
    }],
    'quote-props': ['error', 'consistent'],
    'semi': ['error', 'always'],
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  ignorePatterns: ['dist', 'node_modules'],
};
