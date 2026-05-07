// Shared color palette for chart stories.
//
// Core theme hex values come from apollo-core theme-variables.css:
//   slot 1 → --color-chart-light-blue
//   slot 2 → --color-chart-blue-secondary
//   slot 3 → --color-chart-green
//   slot 4 → --color-chart-yellow
//   slot 5 → --color-chart-pink
//
// Future theme values reference --chart-1 through --chart-5 CSS custom
// properties defined in tailwind.consumer.css for future-light / future-dark.

export const chartTheme = {
  1: {
    light: 'var(--color-chart-light-blue, #38c6f4)',
    dark: 'var(--color-chart-light-blue, #44cffc)',
    'future-light': 'var(--chart-1)',
    'future-dark': 'var(--chart-1)',
  },
  2: {
    light: 'var(--color-chart-blue-secondary, #42a1ff)',
    dark: 'var(--color-chart-blue-secondary, #42a1ff)',
    'future-light': 'var(--chart-2)',
    'future-dark': 'var(--chart-2)',
  },
  3: {
    light: 'var(--color-chart-green, #6eb84a)',
    dark: 'var(--color-chart-green, #74c94b)',
    'future-light': 'var(--chart-3)',
    'future-dark': 'var(--chart-3)',
  },
  4: {
    light: 'var(--color-chart-yellow, #ffb40e)',
    dark: 'var(--color-chart-yellow, #ffbb27)',
    'future-light': 'var(--chart-4)',
    'future-dark': 'var(--chart-4)',
  },
  5: {
    light: 'var(--color-chart-pink, #ed145b)',
    dark: 'var(--color-chart-pink, #f25a8c)',
    'future-light': 'var(--chart-5)',
    'future-dark': 'var(--chart-5)',
  },
} as const;
