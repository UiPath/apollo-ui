import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// react-scan is a dev-only tool — skip it in production Storybook builds.
// main.ts runs in Node (Storybook CLI) so we use process.env.
// preview.tsx runs in the browser (Vite) so it uses import.meta.env.MODE instead.
const isDev = process.env.NODE_ENV !== "production";

// react-scan must install its devtools hook before React initializes.
// Two Storybook behaviors interfere with this:
//   1. A <head> script copies __REACT_DEVTOOLS_GLOBAL_HOOK__ from the parent frame
//      (which is undefined when no browser devtools extension is installed).
//   2. bippy (react-scan's hook installer) sees the property exists via hasOwnProperty,
//      tries to augment it, reads undefined, and bails out.
// Fix: inject a <body> script that deletes the stale property before bippy runs,
// forcing bippy to install a fresh hook. This all executes before React loads
// (React is loaded via type="module" scripts, which are deferred).
const reactScanHook = isDev
  ? readFileSync(
      resolve(
        __dirname,
        "../node_modules/react-scan/dist/install-hook.global.js",
      ),
      "utf-8",
    )
  : "";

const apolloWindSrc = resolve(__dirname, "../../../packages/apollo-wind/src");

const config: StorybookConfig = {
  stories: [
    // For now only include canvas stories
    {
      directory: "../../../packages/apollo-react/src/canvas",
      files: "**/*.stories.@(tsx|ts|jsx|js|mdx)",
      titlePrefix: "Canvas",
    },
  ],
  addons: [],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  viteFinal: async (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(tailwindcss());

    // Resolve apollo-wind to source for HMR in dev.
    config.resolve = config.resolve || {};
    config.resolve.alias = [
      ...(Array.isArray(config.resolve.alias)
        ? config.resolve.alias
        : Object.entries(config.resolve.alias || {}).map(
            ([find, replacement]) => ({
              find,
              replacement,
            }),
          )),
      {
        find: /^@uipath\/apollo-wind\/tailwind\.css$/,
        replacement: resolve(apolloWindSrc, "styles/tailwind.consumer.css"),
      },
      {
        find: /^@uipath\/apollo-wind$/,
        replacement: resolve(apolloWindSrc, "index.ts"),
      },
      {
        find: /^@uipath\/apollo-wind\/(?!.*\.css$)(.*)/,
        replacement: `${apolloWindSrc}/$1`,
      },
      {
        find: /^@\/(.*)/,
        replacement: `${apolloWindSrc}/$1`,
      },
    ];

    return config;
  },

  previewBody: isDev
    ? (body) =>
        `<script>delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__;${reactScanHook}</script>\n${body}`
    : undefined,
};

export default config;
