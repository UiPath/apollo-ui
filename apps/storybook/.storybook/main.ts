import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import type { PluginOption } from 'vite';
import { mergeAlias } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Self-host Monaco's `vs` assets (served at /monaco/vs via staticDirs) instead
// of the @monaco-editor default jsdelivr CDN, which is blocked on the Coded App
// host. monaco-editor is a direct dep of apollo-wind, so resolve from there.
const require = createRequire(import.meta.url);
const monacoVsDir = resolve(
  dirname(
    require.resolve('monaco-editor/package.json', {
      paths: [resolve(__dirname, '../../../packages/apollo-wind')],
    })
  ),
  'min/vs'
);

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
try {
  reactScanHook = readFileSync(
    resolve(__dirname, '../node_modules/react-scan/dist/install-hook.global.js'),
    'utf-8'
  );
} catch {
  // react-scan optional; Storybook works without it
}

const config: StorybookConfig = {
  stories: [
    {
      directory: '../src/introduction',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
    },
    {
      directory: '../src/core',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Apollo Core',
    },
    {
      directory: '../../../packages/apollo-wind/src',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Apollo Wind',
    },
    {
      directory: '../../../packages/apollo-react/src/canvas',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Apollo React/Canvas',
    },
    {
      directory: '../../../packages/apollo-react/src/material',
      files: '**/*.stories.@(tsx|ts|jsx|js|mdx)',
      titlePrefix: 'Apollo React/Material (Maintenance Only)',
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
    { from: monacoVsDir, to: '/monaco/vs' },
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
      /* Docs pages: paint surfaces from Apollo semantic tokens (driven by the
         theme class on <body>, see .storybook/DocsContainer.tsx). The docs
         theme object can't hold var()/oklch values (storybook theming derives
         colors via polished), so the background is tokenized here instead. */
      #storybook-docs .sbdocs-wrapper,
      #storybook-docs .sbdocs-preview,
      #storybook-docs .docs-story {
        background: var(--color-background);
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
  // Only delete the stale devtools hook when we actually have react-scan's
  // installer to put back. Without it, deleting the hook would break React
  // DevTools while reinstalling nothing (react-scan is optional).
  previewBody: reactScanHook
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

    // Rolldown (vite 8) does not substitute `$1` capture groups in string alias
    // replacements the way Rollup/esbuild (vite 7) did, leaving a literal `$1` in
    // the resolved path. The regex→source *subpath* aliases are therefore handled
    // here as an explicit `pre` resolver: plain JS `.replace` honours `$1` in every
    // bundler, and we delegate back to Vite's resolver so extension/index
    // resolution still applies. Exact-match barrels (no `$1`) stay as aliases below.
    const sourceAliasRules: Array<[RegExp, string]> = [
      [/^@uipath\/apollo-wind\/(?!.*\.css$)(.*)/, `${apolloWindSrc}/$1`],
      [/^@uipath\/apollo-react\/canvas\/(?!xyflow\/.*\.css)(.*)/, `${apolloReactSrc}/canvas/$1`],
      [/^@uipath\/apollo-react\/material\/(.*)/, `${apolloReactSrc}/material/$1`],
    ];
    const sourceAliasPlugin = {
      name: 'apollo-source-alias',
      enforce: 'pre' as const,
      async resolveId(
        this: { resolve: (s: string, i?: string, o?: object) => Promise<{ id: string } | null> },
        source: string,
        importer: string | undefined,
        options: object
      ) {
        for (const [pattern, replacement] of sourceAliasRules) {
          if (pattern.test(source)) {
            const rewritten = source.replace(pattern, replacement);
            const resolved = await this.resolve(rewritten, importer, {
              ...options,
              skipSelf: true,
            });
            return resolved ?? rewritten;
          }
        }
        return null;
      },
    };

    return {
      ...config,
      optimizeDeps: {
        ...config.optimizeDeps,
        exclude: [...(config.optimizeDeps?.exclude ?? []), 'monaco-editor'],
      },
      // biome-ignore lint/suspicious/noExplicitAny: plugins array typed as unknown[] after flat/filter; cast required
      plugins: [
        sourceAliasPlugin,
        ...plugins,
        react({ babel: { plugins: ['@lingui/babel-plugin-lingui-macro'] } }),
        // apollo-react material sources import plain .svg as React components
        // (rslib compiles them with @svgr/webpack); mirror that for the
        // source-aliased imports. Scoped so ?url/?import svg imports elsewhere
        // keep resolving as assets.
        svgr({ include: '**/apollo-react/src/material/**/*.svg' }),
        tailwindcss(),
      ] as PluginOption[],
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
          // ── Apollo React → source for HMR ──
          // Canvas barrel (exact match, no trailing path)
          {
            find: /^@uipath\/apollo-react\/canvas$/,
            replacement: resolve(apolloReactSrc, 'canvas/index.ts'),
          },
          // Material barrel (exact match, no trailing path)
          {
            find: /^@uipath\/apollo-react\/material$/,
            replacement: resolve(apolloReactSrc, 'material/index.ts'),
          },
          // Subpath rules with `$1` live in sourceAliasPlugin above (rolldown compat).
        ]),
      },
    };
  },
};

export default config;
