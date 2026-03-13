import type { ToolCallPart, UIMessage } from "@tanstack/ai-client";
import { z } from "zod";

function extractToolCallParts(parts: UIMessage["parts"]): ToolCallPart[] {
  return parts.filter((p): p is ToolCallPart => p.type === "tool-call");
}

function isToolOnlyMessage(message: UIMessage): boolean {
  if (message.role !== "assistant") return false;
  return (
    message.parts.length > 0 &&
    message.parts.every(
      (p) => p.type === "tool-call" || p.type === "tool-result",
    )
  );
}

const choiceOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().optional(),
  recommended: z.boolean().optional(),
});

const toolResultChoicesSchema = z.object({
  type: z.literal("choices"),
  prompt: z.string(),
  options: z.array(choiceOptionSchema),
});

export type ChoiceOption = z.infer<typeof choiceOptionSchema>;
export type ToolResultChoices = z.infer<typeof toolResultChoicesSchema>;

export function findLatestChoices(
  messages: UIMessage[],
): ToolResultChoices | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg || msg.role !== "assistant") continue;
    // Don't show choices if the user already responded after this message
    const hasUserAfter = messages.slice(i + 1).some((m) => m.role === "user");
    if (hasUserAfter) continue;

    for (const part of msg.parts) {
      if (part.type !== "tool-result" || !("content" in part)) continue;
      try {
        const result = toolResultChoicesSchema.safeParse(
          JSON.parse(part.content),
        );
        if (result.success) return result.data;
      } catch {
        // invalid JSON, skip
      }
    }
  }
  return null;
}

export type GroupedItem =
  | { kind: "message"; message: UIMessage }
  | { kind: "tool-group"; id: string; toolCalls: ToolCallPart[] };

type PendingTools = { toolCalls: ToolCallPart[]; groupId: string };

function flushPendingTools(
  items: GroupedItem[],
  pending: PendingTools,
): GroupedItem[] {
  if (pending.toolCalls.length === 0) return items;
  return [
    ...items,
    {
      kind: "tool-group",
      id: pending.groupId,
      toolCalls: pending.toolCalls,
    },
  ];
}

export function groupMessages(
  messages: UIMessage[],
  enableToolGrouping: boolean,
): GroupedItem[] {
  if (!enableToolGrouping) {
    return messages.map((message) => ({ kind: "message" as const, message }));
  }

  const visible = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  const { items, pending } = visible.reduce<{
    items: GroupedItem[];
    pending: PendingTools;
  }>(
    (acc, msg) => {
      if (isToolOnlyMessage(msg)) {
        const newToolCalls = extractToolCallParts(msg.parts);
        return {
          items: acc.items,
          pending: {
            toolCalls: [...acc.pending.toolCalls, ...newToolCalls],
            groupId: acc.pending.groupId || msg.id,
          },
        };
      }

      const newItems = flushPendingTools(acc.items, acc.pending);
      return {
        items: [...newItems, { kind: "message", message: msg }],
        pending: { toolCalls: [], groupId: "" },
      };
    },
    { items: [], pending: { toolCalls: [], groupId: "" } },
  );

  return flushPendingTools(items, pending);
}
