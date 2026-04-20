import { toolDefinition } from "@tanstack/ai";
import { clientTools } from "@tanstack/ai-client";
import { z } from "zod";

const flowOptionSchema = z.object({
  id: z.string().describe("Unique identifier for this option"),
  label: z.string().describe("Button text shown to the user"),
  value: z
    .string()
    .optional()
    .describe("Optional payload value — defaults to label if omitted"),
  recommended: z
    .boolean()
    .optional()
    .describe("Highlight this as the recommended choice"),
  freeText: z
    .boolean()
    .optional()
    .describe(
      "When true, selecting this option lets the user type a custom answer in the input instead of choosing a preset",
    ),
});

const flowStepSchema = z.object({
  id: z.string().describe("Unique identifier for this step"),
  prompt: z.string().describe("The question shown to the user for this step"),
  options: z.array(flowOptionSchema).min(2).max(6).describe("2 to 6 options"),
  canSkip: z.boolean().optional().describe("Allow the user to skip this step"),
});

const presentFlowInput = z.object({
  steps: z
    .array(flowStepSchema)
    .min(2)
    .max(8)
    .describe("Ordered list of steps — all defined upfront"),
});

const presentFlowOutput = presentFlowInput.extend({
  type: z.literal("flow"),
});

const presentFlowDef = toolDefinition({
  name: "presentFlow",
  description: `Present the user with a multi-step guided flow. All steps are defined upfront and the user navigates them client-side — no round-trip between steps. Use this when you need 2–8 answers before you can take action. When the user completes the flow, a single message is sent with all their answers. Only include specific, concrete options per step — never add "Other", "Something else", or any catch-all fallback, as the text input is always available.`,
  inputSchema: presentFlowInput,
  outputSchema: presentFlowOutput,
});

const presentFlow = presentFlowDef.client((input) =>
  Object.assign({ type: "flow" as const }, input),
);

export const flowTool = clientTools(presentFlow);

export const FLOW_TOOL_PROMPT = `
You have a "presentFlow" tool.
Use it when you need to gather 2–8 pieces of information before taking action and the questions are independent (each answer doesn't change the next question).

- Define all steps upfront in the steps array.
- Each step has a prompt and 2–6 options. Only include concrete, specific choices. Do NOT add catch-all options like "Something else", "Other", "None of the above", or any similar fallback — the text input below the card is always available for the user to type a custom answer.
- Mark one option as recommended when there is a clear best pick.
- Set canSkip=true on optional steps.

The user navigates all steps locally — no LLM round-trips between steps. When they finish, you receive a single message with all their answers formatted as:
"Step 1 (prompt): answer, Step 2 (prompt): answer, ..."

The user can also type a custom free-text answer at any step instead of clicking an option. If an answer doesn't match the options you defined, treat it as a valid custom response and proceed — never question or re-ask it.

After calling the tool keep your text reply very short — do NOT list the questions in prose.
`.trim();
