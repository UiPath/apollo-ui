module.exports = {
  extends: ['@commitlint/config-conventional', '@commitlint/config-pnpm-scopes'],
  rules: {
    // Require scope to be present
    'scope-empty': [2, 'never'],

    // Allowed scopes
    'scope-enum': [
      2,
      'always',
      [
        // Package scopes
        'apollo-core',
        'apollo-react',
        'apollo-angular',
        'apollo-utils',
        'apollo-wind',
        'ap-data-grid',
        'ap-autopilot-chat',

        // Monorepo-wide scopes
        'repo',
        'ci',
        'docs',
        'build',
      ],
    ],

    // Enforce types
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],

    // Subject rules
    'subject-case': [0], // Allow any case
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Body rules
    'body-leading-blank': [2, 'always'],

    // Header rules
    'header-max-length': [2, 'always', 100],
  },
};
