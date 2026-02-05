import type { StorybookConfig } from '@storybook/react-vite';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// react-scan is a dev-only tool — skip it in production Storybook builds.
// main.ts runs in Node (Storybook CLI) so we use process.env.
// preview.tsx runs in the browser (Vite) so it uses import.meta.env.MODE instead.
const isDev = process.env.NODE_ENV !== 'production';

// react-scan must install its devtools hook before React initializes.
// Two Storybook behaviors interfere with this:
//   1. A <head> script copies __REACT_DEVTOOLS_GLOBAL_HOOK__ from the parent frame
//      (which is undefined when no browser devtools extension is installed).
//   2. bippy (react-scan's hook installer) sees the property exists via hasOwnProperty,
//      tries to augment it, reads undefined, and bails out.
// Fix: inject a <body> script that deletes the stale property before bippy runs,
// forcing bippy to install a fresh hook. This all executes before React loads
// (React is loaded via type="module" scripts, which are deferred).
let reactScanHook = '';
if (isDev) {
  try {
    reactScanHook = readFileSync(
      resolve(__dirname, '../node_modules/react-scan/dist/install-hook.global.js'),
      'utf-8'
    );
  } catch {
    // react-scan optional; Storybook works without it
  }
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],

  // Serve only public/ (e.g. ui-path.svg for sidebar logo); single dir to avoid route conflicts
  staticDirs: ['../public'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  previewBody: isDev
    ? (body) =>
        `<script>delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;${reactScanHook}</script>\n${body}`
    : undefined,

  async viteFinal(config) {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': resolve(__dirname, '../src'),
        },
      },
    };
  },
};

export default config;
