import type { UiPath } from "@uipath/uipath-typescript/core";

export interface ConversationalAgentAdapterConfig {
  sdk: UiPath;
  agentId: number;
  folderId: number;
}
