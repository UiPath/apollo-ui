import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import nextra from "nextra";

function findRepoRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return start;
    }
    dir = parent;
  }
}

// uip-go copies this app to `.uipath-build/apollo-vertex`. Walk to the
// monorepo root so the compiled workspace package still resolves there.
const repoRoot = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

// dist/ is gitignored. Prefer it when turbo `^build`, the app `dev`/`build`
// scripts, or Coded App preCommands produced it. Fall back to source so the
// package name still resolves if dist is missing. Package `@/` imports are
// rewritten only in dist, so `ensure:vertex` builds it before local `pnpm dev`.
function vertexPackageAliases(): Record<string, string> {
  const distDir = join(repoRoot, "packages/apollo-vertex/dist");
  const srcDir = join(repoRoot, "packages/apollo-vertex/src");
  const useDist = existsSync(join(distDir, "index.js"));
  const root = useDist ? distDir : srcDir;
  const ext = useDist ? ".js" : ".ts";
  if (!existsSync(join(root, `index${ext}`))) {
    return {};
  }
  return {
    "@uipath/apollo-vertex": join(root, `index${ext}`),
    "@uipath/apollo-vertex/shell": join(root, "shell", `index${ext}`),
    "@uipath/apollo-vertex/solution-tests": join(
      root,
      "solution-tests",
      `index${ext}`,
    ),
    "@uipath/apollo-vertex/feature-flags": join(
      root,
      "feature-flags",
      `index${ext}`,
    ),
    "@uipath/apollo-vertex/ai-chat": join(root, "ai-chat", `index${ext}`),
  };
}

const vertexAliases = vertexPackageAliases();

const withNextra = nextra({
  defaultShowCopyCode: true,
});

// Coded App preview builds (uip-go) produce a static export served from a
// sub-path of the Coded App host. There is no server there, so rewrites and
// headers are dropped and the AI Chat demo talks to the platform directly
// using the UIP_GO_PLATFORM_AUTH_* values uip-go resolves at build time.
const codedApp = process.env.APOLLO_CODED_APP === "1";
const codedAppPath = process.env.APOLLO_CODED_APP_PATH?.replaceAll(
  /^\/+|\/+$/g,
  "",
);

// A Coded App build calls the platform directly, so uip-go must have injected
// the platform-auth context. Validate it here. next.config runs in Node during
// `next build`, so a misconfigured deployment fails the build immediately
// rather than shipping a bundle that crashes in the browser.
if (codedApp) {
  const missing = [
    "UIP_GO_PLATFORM_AUTH_BASE_URL",
    "UIP_GO_PLATFORM_AUTH_REDIRECT_PATH",
  ].filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Coded App build is missing platform-auth context: ${missing.join(", ")}. ` +
        "uip-go injects these from the platformAuth section of .uip-go.json; check the deployment recipe.",
    );
  }
}

export default withNextra({
  ...(codedApp
    ? {
        output: "export",
        trailingSlash: true,
        ...(codedAppPath && { basePath: `/${codedAppPath}` }),
        env: {
          NEXT_PUBLIC_APOLLO_CODED_APP: "1",
          NEXT_PUBLIC_APOLLO_CODED_APP_PATH: codedAppPath ?? "",
          // Client id and scope are fixed constants in the app (first-party
          // Uber.Client), so they are not injected here. uip-go still resolves
          // the per-deployment platform context below.
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_BASE_URL:
            process.env.UIP_GO_PLATFORM_AUTH_BASE_URL ?? "",
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_REDIRECT_PATH:
            process.env.UIP_GO_PLATFORM_AUTH_REDIRECT_PATH ?? "",
        },
      }
    : {
        rewrites() {
          return [
            {
              source: "/identity_/:path*",
              destination: "https://alpha.uipath.com/identity_/:path*",
            },
            {
              source: "/_proxy/portal/:orgId/:path*",
              destination: "https://alpha.uipath.com/:orgId/portal_/api/:path*",
            },
          ];
        },
        headers() {
          return [
            {
              source: "/:path*",
              headers: [
                {
                  key: "X-DNS-Prefetch-Control",
                  value: "on",
                },
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
                {
                  key: "X-Frame-Options",
                  value: "SAMEORIGIN",
                },
                {
                  key: "X-Content-Type-Options",
                  value: "nosniff",
                },
                {
                  key: "X-XSS-Protection",
                  value: "1; mode=block",
                },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value: "camera=(), microphone=(), geolocation=()",
                },
              ],
            },
          ];
        },
      }),
  transpilePackages: ["@uipath/apollo-vertex"],
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
      ...vertexAliases,
    },
  },
  webpack(config: {
    resolve?: { alias?: Record<string, string | false | string[]> };
  }) {
    if (Object.keys(vertexAliases).length === 0) {
      return config;
    }
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      ...vertexAliases,
    };
    return config;
  },
});
