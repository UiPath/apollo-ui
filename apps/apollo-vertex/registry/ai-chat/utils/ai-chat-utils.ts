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
