import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}', 'node_modules/@uipath/apollo-wind/components/dist/**/*.js'],
} satisfies Config;
