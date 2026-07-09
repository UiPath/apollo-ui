import { UiPath } from "@uipath/uipath-typescript/core";
import type { OrgTenantInfo } from "./AiChatLoginGate";

export type ChatMode = "agenthub" | "conversational-agent";

export const AICHAT_STORAGE_KEYS = {
  TENANT_ID: "apollo-vertex:ai-chat:tenant-id",
  MODE: "apollo-vertex:ai-chat:mode",
  AGENT: "apollo-vertex:ai-chat:agent",
} as const;

// Coded App preview builds (uip-go) inject the NEXT_PUBLIC_APOLLO_VERTEX_*
// values via next.config.ts. In dev and regular builds they are undefined and
// the defaults below apply, with platform calls going through the same-origin
// Next.js proxy routes.
export const AICHAT_CLIENT_ID =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_CLIENT_ID ||
  "1119a927-10ab-4543-bd1a-ad6bfbbc27f4";
export const AICHAT_SCOPE =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_SCOPE ||
  "openid profile offline_access";

// Non-empty only in Coded App builds, where there is no server for the proxy
// routes and the browser must call the platform host directly.
export const AICHAT_DIRECT_BASE_URL = (
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_BASE_URL || ""
).replace(/\/+$/, "");

export const AICHAT_REDIRECT_PATH =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_REDIRECT_PATH ||
  "/auth_callback";

export const AICHAT_IS_CODED_APP =
  process.env.NEXT_PUBLIC_APOLLO_CODED_APP === "1";

const staticOrgName =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_ORG_NAME || "";
const staticTenantName =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_TENANT_NAME || "";
const staticTenantId =
  process.env.NEXT_PUBLIC_APOLLO_VERTEX_AICHAT_TENANT_ID || staticTenantName;

// Coded App builds bake in the org/tenant the deployment targets because the
// portal endpoint that lists them is not reachable cross-origin.
export const AICHAT_STATIC_ORG =
  staticOrgName && staticTenantName
    ? {
        orgName: staticOrgName,
        tenants: [{ id: staticTenantId, name: staticTenantName }],
      }
    : null;

const UIPATH_BASE_URL = AICHAT_DIRECT_BASE_URL || "https://alpha.uipath.com";

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
    redirectUri: `${origin}/auth_callback`,
    scope: AICHAT_SCOPE,
  });
  sdk.updateToken({ token: accessToken, type: "oauth" });
  return sdk;
}
