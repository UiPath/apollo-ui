"use client";

import { z } from "zod";
import { createDisplayTool } from "../tool-utils";
import { AiChatSuggestions } from "../../components/ai-chat-suggestions";

const choiceOptionSchema = z.object({
  id: z.string().describe("Unique identifier"),
  label: z.string().describe("Button text"),
  value: z.string().optional().describe("Optional payload"),
  recommended: z
    .boolean()
    .optional()
    .describe("Highlight as recommended"),
});

const presentChoicesInput = z.object({
  prompt: z.string().describe("Short label above choices"),
  options: z
    .array(choiceOptionSchema)
    .min(2)
    .max(4)
    .describe("2-4 options"),
});

export type ChoiceOption = z.infer<typeof choiceOptionSchema>;

export const CHOICES_TOOL_PROMPT = `You have a "presentChoices" tool.
When the user asks for choices, options, or says things like "give me some choices", call this tool with 2-4 creative options.
Always mark exactly one option as recommended.
After calling the tool keep your text reply short — the UI renders the options as buttons so do NOT repeat them in prose.`;

export const choicesTool = createDisplayTool({
  name: "presentChoices",
  description:
    "Present the user with 2-4 clickable choices. Call this tool whenever the user asks for choices, options, or wants to pick between alternatives. Mark one option as recommended when there is a clear best pick.",
  inputSchema: presentChoicesInput,
  prompt: CHOICES_TOOL_PROMPT,
  render: (args, { onAction }) => (
    <AiChatSuggestions
      prompt={args.prompt}
      options={args.options}
      onSelect={(option) => onAction(option.label)}
    />
  ),
});
