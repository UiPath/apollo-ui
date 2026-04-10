module.exports = {
  extends: ['@commitlint/config-conventional', '@commitlint/config-pnpm-scopes'],

  // Disable default ignores so merge, fixup, and squash commits are not silently skipped
  defaultIgnores: false,

  // Keep only the ignores we still want (reverts, reapplies, semver version bumps)
  ignores: [
    (commit) => /^(R|r)evert (.*)/.test(commit),
    (commit) => /^(R|r)eapply (.*)/.test(commit),
    (commit) => {
      const firstLine = commit.split('\n').shift();
      if (typeof firstLine !== 'string') return false;
      const stripped = firstLine.replace(/^chore(\([^)]+\))?:/, '').trim();
      return require('semver').valid(stripped) !== null;
    },
  ],

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
        'apollo-wind',
        'ap-chat',

        // Apps scopes
        'apollo-vertex',
        'apollo-wind-storybook',
        'apollo-wind-demo',
        'react-playground',
        'storybook',

        // Monorepo-wide scopes
        'repo',
        'ci',
        'docs',
        'build',
        'workspace',
        'release',
        'l10n',
      ],
    ],

    // Enforce types (merged from both configs)
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
