"use client";

import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";
import { AiChatSuggestions } from "../../components/ai-chat-suggestions";

const choiceOptionSchema = z.object({
  id: z.string().describe("Unique identifier"),
  label: z.string().describe("Button text"),
  value: z.string().optional().describe("Optional payload"),
  recommended: z.boolean().optional().describe("Highlight as recommended"),
});

const presentChoicesInput = z.object({
  prompt: z.string().describe("Short label above choices"),
  options: z.array(choiceOptionSchema).min(1).describe("Clickable options"),
});

export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

export const CHOICES_TOOL_PROMPT = `You have a "presentChoices" tool.
When the conversation benefits from structured options, call this tool.
Show at most 8 options by default, picking the most relevant ones. Only show more if the user explicitly asks for all or a complete list.
Optionally mark one option as recommended if there is a clear best pick.`;

const presentChoicesDef = toolDefinition({
  name: "presentChoices",
  description:
    "Present the user with clickable choices. Call this tool when the conversation benefits from structured options. Optionally mark one option as recommended if there is a clear best pick.",
  inputSchema: presentChoicesInput,
  outputSchema: presentChoicesInput,
  metadata: { skipFollowUp: true },
});

export const presentChoicesClient = presentChoicesDef.client((input) => input);

export function renderChoices(
  output: z.infer<typeof presentChoicesInput>,
  context: { onAction: (message: string) => void },
) {
  const { prompt, options } = output;
  return (
    <AiChatSuggestions
      prompt={prompt}
      options={options}
      onSelect={(option: ChoiceOption) =>
        context.onAction(option.value ?? option.label)
      }
    />
  );
}
