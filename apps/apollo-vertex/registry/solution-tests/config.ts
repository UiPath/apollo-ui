import type { ColumnDef } from "@tanstack/react-table";
import { DEFAULT_PASS_THRESHOLD } from "./constants";
import type { EvaluatorRenderers } from "./evaluators/registry";
import type { ProcessOutputRenderers } from "./outputs/registry";
import type { SolutionTest } from "./types";

/**
 * Telemetry events the Solution Tests actions emit, with payloads. The template
 * names the events; the host supplies `track` (below) to route them. Compose
 * into a host event map with `interface … extends SolutionTestEventMap {}` (not
 * an intersection) so a generic tracker's `Map[K]` indexing keeps working.
 */
export interface SolutionTestEventMap {
  "VS.SolutionTest.Run": {
    mode: "all" | "test" | "selected";
    testCount: number;
  };
  "VS.SolutionTest.Created": { subjectId: string };
  "VS.SolutionTest.ActiveToggled": { testId: string; isActive: boolean };
  "VS.SolutionTest.Deleted": { testId: string };
  "VS.SolutionTest.BatchForceStopped": { batchId: string };
  "VS.SolutionTest.RunForceStopped": { runId: string };
  "VS.SolutionTest.JobAdopted": { resultId: string };
  "VS.SolutionTest.BaselineUpdated": { resultId: string };
  "VS.SolutionTest.BaselineRemoved": { baselineId: string };

  // UI interactions (no server request) — user navigation and output inspection.
  "VS.SolutionTest.TabViewed": { tab: "cases" | "runs" };
  "VS.SolutionTest.TestExpanded": { testId: string };
  "VS.SolutionTest.BatchExpanded": { batchId: string };
  "VS.SolutionTest.RunDetailsOpened": { runId: string };
  "VS.SolutionTest.ResultViewed": { resultId: string };
  "VS.SolutionTest.RawOutputViewed": { processName: string };
}

export type SolutionTestEventName = keyof SolutionTestEventMap;

type UnionToIntersection<U> = (
  U extends unknown
    ? (arg: U) => void
    : never
) extends (arg: infer I) => void
  ? I
  : never;

/**
 * Typed telemetry callback the host injects via config. An intersection of
 * per-event signatures (not one generic signature) so a host tracker generic
 * over a wider event map assigns to it cast-free.
 */
export type TrackSolutionTestEvent = UnionToIntersection<
  {
    [K in SolutionTestEventName]: (
      event: K,
      properties: SolutionTestEventMap[K],
    ) => void;
  }[SolutionTestEventName]
>;

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
  /** Emit a telemetry event for each action. No-op unless the host supplies it. */
  track?: TrackSolutionTestEvent;
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
  /** Optional — call sites use `track?.(…)`, so no tracking happens if absent. */
  track?: TrackSolutionTestEvent;
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
    track: config.track,
  };
}
