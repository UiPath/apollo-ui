import { toolDefinition } from "@tanstack/ai";
import { clientTools } from "@tanstack/ai-client";
import { z } from "zod";

const choiceOptionSchema = z.object({
  id: z.string().describe("Unique identifier for this option"),
  label: z.string().describe("Button text shown to the user"),
  value: z.string().optional().describe("Optional payload sent when selected"),
  recommended: z
    .boolean()
    .optional()
    .describe("Highlight this option as the recommended choice"),
});

const presentChoicesInput = z.object({
  prompt: z.string().describe("Short label shown above the choice buttons"),
  options: z
    .array(choiceOptionSchema)
    .min(2)
    .max(4)
    .describe("2 to 4 options for the user to pick from"),
});

const presentChoicesOutput = presentChoicesInput.extend({
  type: z.literal("choices"),
});

const presentChoicesDef = toolDefinition({
  name: "presentChoices",
  description: `Present the user with 2–4 clickable choices.
                Call this tool whenever the user asks for choices, options, or wants to pick between alternatives.
                Mark one option as recommended when there is a clear best pick.`,
  inputSchema: presentChoicesInput,
  outputSchema: presentChoicesOutput,
});

const presentChoices = presentChoicesDef.client((input) =>
  Object.assign({ type: "choices" }, input),
);

export const choicesTools = clientTools(presentChoices);

export const CHOICES_TOOL_PROMPT = `
You have a "presentChoices" tool.
When the user asks for choices, options, or says things like "give me some choices", call this tool with 2–4 creative options.
Always mark exactly one option as recommended.
After calling the tool keep your text reply short — the UI renders the options as buttons so do NOT repeat them in prose.
`.trim();
