import type { AnyClientTool } from "@tanstack/ai";
import type { ReactNode } from "react";

/**
 * Associates a TanStack AI ClientTool with rendering and system prompt snippet.
 */
export interface AiChatTool {
  tool: AnyClientTool;
  prompt: string;
  render?: (
    args: unknown,
    context: { onAction: (message: string) => void },
  ) => ReactNode;
}

/**
 * Record of display tools keyed by tool name, passed to AiChatMessage.
 */
export type DisplayTools = Record<string, AiChatTool>;
