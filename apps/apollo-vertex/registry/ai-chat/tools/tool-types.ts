import type { AnyClientTool } from "@tanstack/ai";
import type { ReactNode } from "react";

export interface AiChatTool {
  tool: AnyClientTool;
  prompt: string;
  render?: (
    args: unknown,
    context: { onAction: (message: string) => void },
  ) => ReactNode;
}

export type DisplayTools = Record<string, AiChatTool>;
