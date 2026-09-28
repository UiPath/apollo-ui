import { UiPath } from "@uipath/uipath-typescript/core";
import { z } from "zod";
import type { OrgTenantInfo } from "./AiChatLoginGate";

export type ChatMode = "agenthub" | "conversational-agent";

export const AICHAT_STORAGE_KEYS = {
  TENANT_ID: "apollo-vertex:ai-chat:tenant-id",
  MODE: "apollo-vertex:ai-chat:mode",
  AGENT: "apollo-vertex:ai-chat:agent",
} as const;

// UiPath's first-party Portal client (Uber.Client). Its browser tokens skip
// the external-app audience checks, so the demo reaches Data Fabric and
// AgentHub with just the base OIDC scopes. Coded App preview hosts are
// pre-registered as redirect URIs on this client via a host wildcard in
// first-party-service-metadata, so there is no per-deployment client or
// redirect-URI registration. Same client id in dev and in Coded App builds.
export const AICHAT_CLIENT_ID = "1119a927-10ab-4543-bd1a-ad6bfbbc27f4";
export const AICHAT_SCOPE = "openid profile offline_access";

export const AICHAT_IS_CODED_APP =
  process.env.NEXT_PUBLIC_APOLLO_CODED_APP === "1";

// The Coded App base path (e.g. "apollo-vertex"), baked by next.config. Empty
// in dev / regular builds. Used to build same-app absolute URLs such as the
// post-logout return target.
export const AICHAT_CODED_APP_PATH =
  process.env.NEXT_PUBLIC_APOLLO_CODED_APP_PATH ?? "";

// Two modes, chosen at build time:
//   - Coded App export: there is no server, so the browser calls the platform
//     host directly. uip-go bakes the platform context (base URL, redirect
//     path) into the bundle, and it is required — a missing value fails the
//     build here rather than shipping a chat that cannot sign in.
//   - Dev / regular build: the app reaches the platform through the
//     same-origin Next.js proxy routes, so there is no baked platform context
//     and the org/tenant are discovered at runtime.
function loadCodedAppPlatformAuth() {
  const parsed = z
    .object({
      baseUrl: z.string().min(1),
      redirectPath: z.string().min(1),
    })
    .safeParse({
      baseUrl: process.env.NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_BASE_URL,
      redirectPath:
        process.env.NEXT_PUBLIC_APOLLO_VERTEX_PLATFORM_AUTH_REDIRECT_PATH,
    });
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .join(", ");
    throw new Error(
      `Coded App build is missing platform-auth context (${missing}). uip-go injects these from the platformAuth section of .uip-go.json; check the deployment recipe.`,
    );
  }
  return parsed.data;
}

const codedAppPlatformAuth = AICHAT_IS_CODED_APP
  ? loadCodedAppPlatformAuth()
  : null;

// Empty in dev (use the same-origin proxy); the platform host in a Coded App
// build (call it directly).
export const AICHAT_DIRECT_BASE_URL = codedAppPlatformAuth
  ? codedAppPlatformAuth.baseUrl.replace(/\/+$/, "")
  : "";

export const AICHAT_REDIRECT_PATH = codedAppPlatformAuth
  ? codedAppPlatformAuth.redirectPath.startsWith("/")
    ? codedAppPlatformAuth.redirectPath
    : `/${codedAppPlatformAuth.redirectPath}`
  : "/auth_callback";

// The portal endpoint that lists the caller's org + tenants has no CORS on the
// portal domain, but it DOES on the api host. So a Coded App calls it directly
// from the browser for the CALLER'S OWN org (taken from their token) — which
// works across any org the user belongs to, with no deployment-pinned org.
// Map the portal host to the api host:
//   cloud.uipath.com  -> api.uipath.com         (prod: "cloud" is dropped)
//   <env>.uipath.com  -> <env>.api.uipath.com   (staging, alpha, ...)
// In dev the login gate uses the same-origin proxy instead (null here).
function toApiBaseUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  const [env, ...rest] = url.hostname.split(".");
  const domain = rest.join(".");
  url.hostname = env === "cloud" ? `api.${domain}` : `${env}.api.${domain}`;
  return url.origin;
}

export const AICHAT_PORTAL_API_BASE = codedAppPlatformAuth
  ? toApiBaseUrl(codedAppPlatformAuth.baseUrl)
  : null;

// Coded App builds call the baked host directly; dev targets alpha.
const UIPATH_BASE_URL = AICHAT_IS_CODED_APP
  ? AICHAT_DIRECT_BASE_URL
  : "https://alpha.uipath.com";

export function createUiPathSdk(
  accessToken: string,
  orgTenant: OrgTenantInfo,
): UiPath {
  const origin =
    typeof window === "undefined" ? UIPATH_BASE_URL : window.location.origin;

  const sdk = new UiPath({
    baseUrl: UIPATH_BASE_URL,
    orgName: orgTenant.orgName,
    tenantName: orgTenant.tenantName,
    clientId: AICHAT_CLIENT_ID,
    redirectUri: `${origin}${AICHAT_REDIRECT_PATH}`,
    scope: AICHAT_SCOPE,
  });
  sdk.updateToken({ token: accessToken, type: "oauth" });
  return sdk;
}
