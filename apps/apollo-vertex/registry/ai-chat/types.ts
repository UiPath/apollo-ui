import type { AnyClientTool, InferToolInput } from "@tanstack/ai";
import type { ReactNode } from "react";

export type ToolRenderers<
  TTools extends ReadonlyArray<AnyClientTool> = ReadonlyArray<AnyClientTool>,
> = {
  [K in TTools[number]["name"]]?: (
    args: InferToolInput<Extract<TTools[number], { name: K }>>,
  ) => ReactNode;
};

export type { ChoiceOption, ToolResultChoices } from "./utils/ai-chat-utils";
