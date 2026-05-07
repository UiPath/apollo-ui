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
    light: '#38c6f4',
    dark: '#44cffc',
    'future-light': 'var(--chart-1)',
    'future-dark': 'var(--chart-1)',
  },
  2: {
    light: '#42a1ff',
    dark: '#42a1ff',
    'future-light': 'var(--chart-2)',
    'future-dark': 'var(--chart-2)',
  },
  3: {
    light: '#6eb84a',
    dark: '#74c94b',
    'future-light': 'var(--chart-3)',
    'future-dark': 'var(--chart-3)',
  },
  4: {
    light: '#ffb40e',
    dark: '#ffbb27',
    'future-light': 'var(--chart-4)',
    'future-dark': 'var(--chart-4)',
  },
  5: {
    light: '#ed145b',
    dark: '#f25a8c',
    'future-light': 'var(--chart-5)',
    'future-dark': 'var(--chart-5)',
  },
} as const;
