export default {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-tailwindcss',
    'stylelint-config-prettier',
  ],
  plugins: ['stylelint-prettier'],
  rules: {
    'prettier/prettier': true,
    // Allow Tailwind's @layer directive
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen', 'layer', 'config'],
      },
    ],
    // Allow CSS custom properties (CSS variables)
    'custom-property-pattern': null,
    // Allow class selectors that match Tailwind patterns
    'selector-class-pattern': null,
  },
};
