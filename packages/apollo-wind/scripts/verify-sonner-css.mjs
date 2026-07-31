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

const sonnerImport = 'sonner/dist/styles.css';

if (!consumerCss.includes(`@import "${sonnerImport}";`)) {
  throw new Error(`Apollo Wind tailwind.css is missing the ${sonnerImport} import`);
}

// The import above is only useful if consumers can actually resolve it, which
// requires `sonner` to stay a runtime dependency (not a devDependency).
try {
  await import.meta.resolve(sonnerImport);
} catch (error) {
  throw new Error(
    `Apollo Wind tailwind.css imports "${sonnerImport}" but it does not resolve — ` +
      `is "sonner" still a runtime dependency? (${error.message})`
  );
}
