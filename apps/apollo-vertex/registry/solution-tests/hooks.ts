/**
 * Collection-backed data layer for the Solution Tests view — one module per
 * query entity, each owning its live read plus the writes that act on it:
 *  - `use-solution-tests`           — tests list + run / toggle-active / delete
 *  - `use-solution-test-batch-runs` — batch-run list
 *  - `use-solution-test-runs`       — run list
 *  - `use-baseline-jobs`            — baseline jobs + remove-baseline / expected-output
 *  - `use-run-results`              — run results + adopt / update-baseline / attachment
 *  - `use-force-stop`               — force-stop a batch or a single run
 *
 * Reads are live (one `useSolution()` + `useLiveQuery` per collection); the
 * view re-renders as the collections change. Writes run through the provider's
 * injected trigger actions (run / delete / force-stop / baseline), except
 * toggle-active (a direct collection update) and attachment reads (the
 * uipath-typescript SDK).
 */

export {
  useSolutionTests,
  useRunTests,
  useToggleTestActive,
  useDeleteTest,
} from "./use-solution-tests";
export type { UseSolutionTestsResult } from "./use-solution-tests";

export { useSolutionTestBatchRuns } from "./use-solution-test-batch-runs";
export type { UseSolutionTestBatchRunsResult } from "./use-solution-test-batch-runs";

export { useSolutionTestRuns } from "./use-solution-test-runs";
export type { UseSolutionTestRunsResult } from "./use-solution-test-runs";

export {
  useBaselineJobs,
  useRemoveJobBaseline,
  useJobExpectedOutput,
} from "./use-baseline-jobs";
export type { UseBaselineJobsResult } from "./use-baseline-jobs";

export {
  useRunResults,
  useAdoptJob,
  useUpdateBaseline,
  useResultAttachment,
} from "./use-run-results";
export type { UseRunResultsResult } from "./use-run-results";

export { useForceStopBatch, useForceStopRun } from "./use-force-stop";

export type { MutationHookResult, AttachmentFetcher } from "./mutations";
export type { ResultAttachmentField } from "./types";
