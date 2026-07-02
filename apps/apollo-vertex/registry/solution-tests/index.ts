/**
 * Solution Tests view — a domain-neutral, registry-ready feature.
 *
 * Wrap `<SolutionTests />` (the smart container) in a `<SolutionTestsProvider
 * triggerBaseUrl getToken config>`:
 *  - reads come from the collection-backed hooks (the consumer ensures the
 *    `UiPathST*` entity collections exist on their vs-core solution).
 *  - writes POST to `triggerBaseUrl`, authenticated with `getToken`.
 *  - `config` (SolutionTestsConfig) parameterizes the subject entity columns
 *    and navigation.
 *
 * `SolutionTestsView` is the dumb presentational view (data + callbacks via
 * props) for consumers who want to supply their own data plumbing or mocks.
 *
 * Renders with apollo-vertex UI primitives and translates framework strings
 * via react-i18next.
 */

export { SolutionTests } from "./solution-tests";
export { SolutionTestsView } from "./solution-tests-view";
export type { SolutionTestsViewProps } from "./solution-tests-view";
export { SaveAsTestButton } from "./save-as-test-button";
export { SolutionTestActionError } from "./errors";
export type { ActionFailure } from "./errors";
export {
  SolutionTestsProvider,
  useSolutionTestsContext,
  useSolutionTestsConfig,
} from "./context";
export type {
  SolutionTestsConfig,
  ResolvedSolutionTestsConfig,
} from "./config";
export {
  useSolutionTests,
  useSolutionTestBatchRuns,
  useSolutionTestRuns,
  useBaselineJobs,
  useRunResults,
  useRunTests,
  useCreateTest,
  useToggleTestActive,
  useDeleteTest,
  useForceStopBatch,
  useForceStopRun,
  useAdoptJob,
  useUpdateBaseline,
  useRemoveJobBaseline,
  useJobExpectedOutput,
  useResultAttachment,
} from "./hooks";
export type {
  UseSolutionTestsResult,
  UseSolutionTestBatchRunsResult,
  UseSolutionTestRunsResult,
  UseBaselineJobsResult,
  UseRunResultsResult,
  MutationHook,
  AttachmentFetcher,
} from "./hooks";
export {
  SolutionTestStatus,
  RunStatus,
  RunResultStatus,
  JobRole,
} from "./types";
export type {
  SolutionTest,
  SolutionTestJob,
  SolutionTestRun,
  SolutionTestBatchRun,
  SolutionTestRunResult,
  UserMessageItem,
  ResultAttachmentField,
} from "./types";
