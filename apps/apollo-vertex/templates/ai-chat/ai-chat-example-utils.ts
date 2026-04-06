import { UiPath } from "@uipath/uipath-typescript/core";
import type { OrgTenantInfo } from "./AiChatLoginGate";

export type ChatMode = "agenthub" | "conversational-agent";

export const AICHAT_STORAGE_KEYS = {
  TENANT_ID: "apollo-vertex:ai-chat:tenant-id",
  MODE: "apollo-vertex:ai-chat:mode",
  AGENT: "apollo-vertex:ai-chat:agent",
} as const;

export const AICHAT_CLIENT_ID = "1119a927-10ab-4543-bd1a-ad6bfbbc27f4";
export const AICHAT_SCOPE = "openid profile offline_access";

const UIPATH_BASE_URL = "https://alpha.uipath.com";

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
