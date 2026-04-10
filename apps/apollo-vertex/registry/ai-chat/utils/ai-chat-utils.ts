import type { UIMessage } from "@tanstack/ai-client";
import { z } from "zod";

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

/**
 * Returns true if the message contains a choices tool call/result.
 * Handles both shapes:
 *   - `tool-result` with `content` (stringified JSON, server/wire format)
 *   - `tool-call` with `output` (parsed object, client tools)
 */
export function messageHasChoices(message: UIMessage): boolean {
  return message.parts.some((part) => {
    // tool-result with stringified JSON content
    if (part.type === "tool-result" && "content" in part) {
      try {
        const parsed = JSON.parse((part as { content: string }).content);
        if (parsed?.type === "choices") return true;
      } catch {
        // invalid JSON, skip
      }
    }
    // tool-call with parsed object output (client tools)
    if (part.type === "tool-call" && "output" in part) {
      const output = (part as { output?: unknown }).output;
      if (
        output != null &&
        typeof output === "object" &&
        "type" in output &&
        (output as { type: unknown }).type === "choices"
      ) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Returns the set of assistant message IDs that belong to a turn currently
 * presenting interactive choices. This is all trailing assistant messages
 * (after the latest user message) IF any of them contains a choices tool-call/result.
 *
 * Used to suppress message-level actions (copy/feedback/regenerate) on the entire
 * choice-prompt turn — including any text-only assistant message that introduces
 * the choices, since the choices tool-call may be on a separate sibling message.
 */
export function findActiveChoicesMessageIds(
  messages: UIMessage[],
): Set<string> {
  // Find the index of the most recent user message
  let lastUserIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg && msg.role === "user") {
      lastUserIdx = i;
      break;
    }
  }

  // Trailing assistant messages — everything after the latest user message
  const trailingAssistants = messages
    .slice(lastUserIdx + 1)
    .filter((m) => m.role === "assistant");

  // Only suppress actions if at least one trailing assistant has choices
  const hasActiveChoices = trailingAssistants.some((m) => messageHasChoices(m));
  if (!hasActiveChoices) return new Set();

  return new Set(trailingAssistants.map((m) => m.id));
}
