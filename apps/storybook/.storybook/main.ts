import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeAlias } from 'vite';

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
  stories: [
    {
      directory: '../../../packages/apollo-wind/src',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Wind',
    },
    {
      directory: '../../../packages/apollo-react/src/canvas',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Canvas',
    },
    {
      directory: '../../../packages/apollo-react/src/material',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Material (Maintenance Only)',
    },
    {
      directory: '../src',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Core',
    },
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-mcp',
  ],
  features: {
    experimentalComponentsManifest: true,
  },
  staticDirs: [
    '../../../packages/apollo-wind/public',
    {
      from: '../../../packages/apollo-core/src/icons/svg/third-party',
      to: '/brand',
    },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  previewHead: (head) => `
    ${head}
    <!-- Inter + JetBrains Mono fonts for Future design system -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <style>
      /* Remove default Storybook padding */
      #storybook-root {
        padding: 0 !important;
      }
      .sb-show-main {
        padding: 0 !important;
      }
      #storybook-root > * {
        width: 100%;
        height: 100%;
      }
    </style>
  `,
  managerHead: (head) => `
    ${head}
    <style>
      .sidebar-header img {
        max-height: 28px;
        width: auto;
      }
    </style>
  `,
  previewBody: isDev
    ? (body) =>
        `<script>delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;${reactScanHook}</script>\n${body}`
    : undefined,
  async viteFinal(config) {
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    const react = (await import('@vitejs/plugin-react')).default;
    const svgr = (await import('vite-plugin-svgr')).default;

    const apolloWindSrc = resolve(__dirname, '../../../packages/apollo-wind/src');
    const apolloReactSrc = resolve(__dirname, '../../../packages/apollo-react/src');

    // Replace the framework's default react plugin with one that compiles
    // lingui macros — apollo-react source (aliased below for HMR) uses
    // `@lingui/core/macro`, which must be transformed at build time.
    // The macro plugin resolves the lingui config from cwd (apps/storybook);
    // LINGUI_CONFIG points it at apollo-react's config instead.
    process.env.LINGUI_CONFIG = resolve(apolloReactSrc, '../lingui.config.ts');
    const plugins = ((config.plugins || []) as unknown[])
      .flat(Number.POSITIVE_INFINITY)
      .filter(
        (plugin) =>
          !(
            plugin &&
            typeof plugin === 'object' &&
            'name' in plugin &&
            typeof plugin.name === 'string' &&
            (plugin.name === 'vite:react-babel' || plugin.name === 'vite:react-refresh')
          )
      );

    return {
      ...config,
      plugins: [
        ...plugins,
        react({ babel: { plugins: ['@lingui/babel-plugin-lingui-macro'] } }),
        // apollo-react material sources import plain .svg as React components
        // (rslib compiles them with @svgr/webpack); mirror that for the
        // source-aliased imports. Scoped so ?url/?import svg imports elsewhere
        // keep resolving as assets.
        svgr({ include: '**/apollo-react/src/material/**/*.svg' }),
        tailwindcss(),
      ],
      resolve: {
        ...config.resolve,
        alias: mergeAlias(config.resolve?.alias, [
          // ── Apollo Wind → source for HMR ──
          { find: '@', replacement: apolloWindSrc },
          {
            find: /^@uipath\/apollo-wind\/tailwind\.css$/,
            replacement: resolve(apolloWindSrc, 'styles/tailwind.consumer.css'),
          },
          {
            find: /^@uipath\/apollo-wind$/,
            replacement: resolve(apolloWindSrc, 'index.ts'),
          },
          {
            find: /^@uipath\/apollo-wind\/(?!.*\.css$)(.*)/,
            replacement: `${apolloWindSrc}/$1`,
          },
          // ── Apollo React → source for HMR ──
          // Canvas barrel (exact match, no trailing path)
          {
            find: /^@uipath\/apollo-react\/canvas$/,
            replacement: resolve(apolloReactSrc, 'canvas/index.ts'),
          },
          // Canvas subpaths (exclude xyflow CSS — vendored, only in dist)
          {
            find: /^@uipath\/apollo-react\/canvas\/(?!xyflow\/.*\.css)(.*)/,
            replacement: `${apolloReactSrc}/canvas/$1`,
          },
          // Material barrel + subpaths
          {
            find: /^@uipath\/apollo-react\/material$/,
            replacement: resolve(apolloReactSrc, 'material/index.ts'),
          },
          {
            find: /^@uipath\/apollo-react\/material\/(.*)/,
            replacement: `${apolloReactSrc}/material/$1`,
          },
        ]),
      },
    };
  },
};

export default config;
