"use client";

import type { ComponentType, ReactNode } from "react";
import type { z } from "zod";

export interface ProcessOutputRenderArgs {
  /** Raw, unvalidated output attachment. */
  output: unknown;
}

export type ProcessOutputProps<TOutput = unknown> = { output: TOutput };

/** Returns `null` when it can't render this output (caller falls back to raw JSON). */
export type ProcessOutputRenderer = (
  args: ProcessOutputRenderArgs,
) => ReactNode;

/** Keyed by stable agent id (uipath.json#id) or process name. */
export type ProcessOutputRenderers = Record<string, ProcessOutputRenderer>;

export function makeProcessOutputRenderer<TOutput, TExtra extends object>(
  schema: z.ZodType<TOutput>,
  Component: ComponentType<ProcessOutputProps<TOutput> & TExtra>,
  bound: TExtra,
): ProcessOutputRenderer {
  return ({ output }: ProcessOutputRenderArgs): ReactNode => {
    const parsed = schema.safeParse(output);
    if (!parsed.success) {
      return null;
    }
    return <Component output={parsed.data} {...bound} />;
  };
}

/** Precedence mirrors the BE's `get_evaluators_for_process`. */
export function resolveProcessOutputRenderer(
  source: { agentId?: string; processName?: string },
  renderers: ProcessOutputRenderers,
): ProcessOutputRenderer | undefined {
  return [source.agentId, source.processName]
    .filter((key): key is string => key != null)
    .map((key) => renderers[key])
    .find((renderer) => renderer != null);
}
