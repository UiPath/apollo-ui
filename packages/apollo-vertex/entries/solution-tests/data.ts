// Solution Tests containers and hooks backed by @uipath/vs-core and
// @tanstack/react-db. Import presentational views from
// `@uipath/apollo-vertex/solution-tests`.

export { SolutionTests } from "@/registry/solution-tests/solution-tests";
export { RunDetails } from "@/registry/solution-tests/run-details";
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
} from "@/registry/solution-tests/hooks";
export type {
  UseSolutionTestsResult,
  UseSolutionTestBatchRunsResult,
  UseSolutionTestRunsResult,
  UseBaselineJobsResult,
  UseRunResultsResult,
  MutationHook,
  AttachmentFetcher,
} from "@/registry/solution-tests/hooks";
export { ExpandedAgents } from "@/registry/solution-tests/expanded-agents";
export { ExpandedRunTests } from "@/registry/solution-tests/expanded-run-tests";
