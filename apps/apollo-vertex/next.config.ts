import nextra from "nextra";

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
// the platform context. Validate it here — next.config runs in Node during
// `next build`, so a misconfigured deployment fails the build immediately
// rather than shipping a bundle that crashes in the browser. uip-go always
// resolves the tenant id (falling back to the tenant name), so it is required
// too.
if (codedApp) {
  const missing = [
    "UIP_GO_PLATFORM_AUTH_BASE_URL",
    "UIP_GO_PLATFORM_AUTH_ORG_NAME",
    "UIP_GO_PLATFORM_AUTH_TENANT_NAME",
    "UIP_GO_PLATFORM_AUTH_TENANT_ID",
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
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_ORG_NAME:
            process.env.UIP_GO_PLATFORM_AUTH_ORG_NAME ?? "",
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_TENANT_NAME:
            process.env.UIP_GO_PLATFORM_AUTH_TENANT_NAME ?? "",
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_TENANT_ID:
            process.env.UIP_GO_PLATFORM_AUTH_TENANT_ID ?? "",
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
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      "next-mdx-import-source-file": "./mdx-components.tsx",
    },
  },
});
