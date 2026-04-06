/**
 * @deprecated Use `choicesTool` from `@/registry/ai-chat/tools/choices` instead.
 * This file is a backward-compatibility bridge.
 */
import { clientTools } from "@tanstack/ai-client";
import { choicesTool, CHOICES_TOOL_PROMPT } from "../tools/choices";

export { CHOICES_TOOL_PROMPT };

export const choicesTools = clientTools(choicesTool.tool);
