import { readFileSync } from 'node:fs';

const compiledCss = readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');
const consumerCss = readFileSync(new URL('../dist/tailwind.css', import.meta.url), 'utf8');

const requiredSelectors = ['[data-sonner-toaster]', '[data-sonner-toast]'];
const missingSelectors = requiredSelectors.filter((selector) => !compiledCss.includes(selector));

if (missingSelectors.length > 0) {
  throw new Error(
    `Apollo Wind styles.css is missing Sonner selectors: ${missingSelectors.join(', ')}`
  );
}

if (!consumerCss.includes('@import "sonner/dist/styles.css";')) {
  throw new Error('Apollo Wind tailwind.css is missing the sonner/dist/styles.css import');
}
