import type { ColumnDef } from "@tanstack/react-table";
import { DEFAULT_PASS_THRESHOLD } from "./constants";
import type { EvaluatorRenderers } from "./evaluators/registry";
import type { ProcessOutputRenderers } from "./outputs/registry";
import type { SolutionTest } from "./types";

/** Per-vertical presentation config; everything else is hard-coded in `constants`. */
export interface SolutionTestsConfig {
  /** Columns inserted between the Test Name and Version columns. */
  subjectColumns?: ColumnDef<SolutionTest>[];
  /** When set, the test name links to its subject. */
  getSubjectHref?: (test: SolutionTest) => string | undefined;
  subjectNoun?: { singular: string; plural: string };
  /** Score at/above which a result passes (drives pass color + KPI trend line). Defaults to 0.9. */
  passThreshold?: number;
  showDebug?: boolean;
  /** Custom evaluator-id -> renderer map; wins over the built-in registry.
   * The FE counterpart to the BE `custom_evaluator_builders`. */
  evaluatorRenderers?: EvaluatorRenderers;
  /** Keyed by stable agent id and/or process name; unmatched outputs render as raw JSON. */
  outputRenderers?: ProcessOutputRenderers;
}

/** Config with defaults applied — what components read from context. */
export interface ResolvedSolutionTestsConfig {
  subjectColumns: ColumnDef<SolutionTest>[];
  getSubjectHref?: (test: SolutionTest) => string | undefined;
  subjectNoun?: { singular: string; plural: string };
  passThreshold: number;
  showDebug: boolean;
  evaluatorRenderers: EvaluatorRenderers;
  outputRenderers: ProcessOutputRenderers;
}

export function resolveConfig(
  config: SolutionTestsConfig = {},
): ResolvedSolutionTestsConfig {
  return {
    subjectColumns: config.subjectColumns ?? [],
    getSubjectHref: config.getSubjectHref,
    subjectNoun: config.subjectNoun,
    passThreshold: config.passThreshold ?? DEFAULT_PASS_THRESHOLD,
    showDebug: config.showDebug ?? false,
    evaluatorRenderers: config.evaluatorRenderers ?? {},
    outputRenderers: config.outputRenderers ?? {},
  };
}
