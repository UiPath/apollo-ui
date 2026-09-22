/**
 * vs-core / @tanstack/react-db backed Solution Tests data layer.
 *
 * Import presentational views from `@uipath/apollo-vertex/solution-tests`.
 * Import this subpath only when the host app provides those optional peers.
 */

export { SolutionTests } from './solution-tests';
export { RunDetails } from './run-details';
export { ExpandedAgents } from './expanded-agents';
export { ExpandedRunTests } from './expanded-run-tests';
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
} from './hooks';
export type {
  UseSolutionTestsResult,
  UseSolutionTestBatchRunsResult,
  UseSolutionTestRunsResult,
  UseBaselineJobsResult,
  UseRunResultsResult,
  MutationHook,
  AttachmentFetcher,
} from './hooks';
