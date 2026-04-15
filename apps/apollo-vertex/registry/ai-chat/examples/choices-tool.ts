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
    .max(6)
    .describe("2 to 6 options for the user to pick from"),
  step: z.number().optional().describe("Current step number (1-based) — include when this is part of a multi-step flow"),
  totalSteps: z.number().optional().describe("Total number of steps in the flow — include alongside step"),
  canSkip: z.boolean().optional().describe("Show a skip button for this step"),
  canGoBack: z.boolean().optional().describe("Show a back button to let the user revise their previous answer"),
});

const presentChoicesOutput = presentChoicesInput.extend({
  type: z.literal("choices"),
});

const presentChoicesDef = toolDefinition({
  name: "presentChoices",
  description: `Present the user with clickable choices. Call this tool whenever the user needs to pick between alternatives, or when gathering information step by step. Mark one option as recommended when there is a clear best pick. For multi-step flows, include step/totalSteps and set canGoBack=true after the first step.`,
  inputSchema: presentChoicesInput,
  outputSchema: presentChoicesOutput,
});

const presentChoices = presentChoicesDef.client((input) =>
  Object.assign({ type: "choices" as const }, input),
);

export const choicesTools = clientTools(presentChoices);

export const CHOICES_TOOL_PROMPT = `
You have a "presentChoices" tool.
Use it when the user asks for choices, options, or when you need to gather information step by step before taking action.

Single-step: call with 2–6 options, mark one as recommended when there is a clear best pick.

Multi-step flows: when you need multiple pieces of information, call this tool once per step.
- Set step (1-based) and totalSteps on every call in the flow.
- Set canGoBack=true on step 2 and beyond so the user can revise previous answers.
- Set canSkip=true on optional steps.
- Always include a "Something else" option (id: "other") as the last choice so the user can type a custom answer.

After calling the tool keep your text reply short — the UI renders the options as buttons so do NOT repeat them in prose.
`.trim();
