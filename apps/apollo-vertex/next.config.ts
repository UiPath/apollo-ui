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

export default withNextra({
  ...(codedApp
    ? {
        output: "export",
        trailingSlash: true,
        ...(codedAppPath && { basePath: `/${codedAppPath}` }),
        env: {
          NEXT_PUBLIC_APOLLO_CODED_APP: "1",
          NEXT_PUBLIC_APOLLO_CODED_APP_PATH: codedAppPath ?? "",
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_CLIENT_ID:
            process.env.UIP_GO_PLATFORM_AUTH_CLIENT_ID ?? "",
          NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_SCOPE:
            process.env.UIP_GO_PLATFORM_AUTH_SCOPE ?? "",
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
