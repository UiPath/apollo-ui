/** Setup constants for the Solution Tests view — collection names, trigger
 *  slugs/paths, thresholds, and label maps. Edit here to retarget a deployment. */

import { RunResultStatus, RunStatus, SolutionTestStatus } from "./types";

/** Well-known Solution Test collection names on `solution.api.collections.solutionTests`. */
export const ENTITY = {
  tests: "UiPathSTTests",
  batchRuns: "UiPathSTBatchRuns",
  runs: "UiPathSTRuns",
  jobs: "UiPathSTJobs",
  runResults: "UiPathSTRunResults",
} as const;

/** API-trigger slugs appended to the consumer's trigger base URL. */
export const RUN_TESTS_SLUG = "run_solution_tests";
export const AUTOMATION_FUNCTIONS_SLUG = "automation-functions";

/** `automation-functions` RPC paths. */
export const AUTOMATION_FUNCTION_PATH = {
  createTest: "/solution-tests/create",
  deleteTest: "/solution-tests/delete",
  forceStopBatch: "/solution-tests/force-stop-batch",
  forceStopRun: "/solution-tests/force-stop",
  adoptJob: "/solution-tests/adopt-job",
  updateBaseline: "/solution-tests/update-baseline",
  removeJobBaseline: "/solution-tests/remove-job-baseline",
} as const;

/** Agent `output_data.status` values treated as success. */
export const AGENT_SUCCESS_STATUSES = new Set(["success", "partial_success"]);

/** Default score ≥ threshold for a pass; overridable via `config.passThreshold`. */
export const DEFAULT_PASS_THRESHOLD = 0.9;

/** Most recent completed batches plotted on the KPI score-trend chart. */
export const MAX_TREND_POINTS = 10;

/** Evaluator id → display label. */
export const EVALUATOR_LABELS: Record<string, string> = {
  "uipath-json-similarity": "JSON Similarity",
  "uipath-llm-judge-output-semantic-similarity": "LLM Judge",
};

/** Numeric status enum → English label. */
export const defaultTestStatusLabels: Record<number, string> = {
  [SolutionTestStatus.Pending]: "Pending",
  [SolutionTestStatus.Ready]: "Ready",
  [SolutionTestStatus.Error]: "Error",
};

export const defaultRunStatusLabels: Record<number, string> = {
  [RunStatus.Pending]: "Pending",
  [RunStatus.Running]: "Running",
  [RunStatus.Passed]: "Passed",
  [RunStatus.Failed]: "Failed",
  [RunStatus.Error]: "Error",
  [RunStatus.Aborted]: "Aborted",
};

export const defaultRunResultStatusLabels: Record<number, string> = {
  [RunResultStatus.Pending]: "Pending",
  [RunResultStatus.Passed]: "Passed",
  [RunResultStatus.Failed]: "Failed",
  [RunResultStatus.Error]: "Error",
  [RunResultStatus.NoBaseline]: "New",
  [RunResultStatus.Missing]: "Did not run",
  [RunResultStatus.Aborted]: "Aborted",
};
