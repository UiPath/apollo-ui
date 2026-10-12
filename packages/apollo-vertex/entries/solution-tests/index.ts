// Presentational Solution Tests API. Containers and collection-backed hooks
// that need @uipath/vs-core and @tanstack/react-db live at
// `@uipath/apollo-vertex/solution-tests/data`.

export { SolutionTestsView } from "@/registry/solution-tests/solution-tests-view";
export type { SolutionTestsViewProps } from "@/registry/solution-tests/solution-tests-view";
export { SaveAsTestButton } from "@/registry/solution-tests/save-as-test-button";
export { SolutionTestActionError } from "@/registry/solution-tests/errors";
export type { ActionFailure } from "@/registry/solution-tests/errors";
export {
  SolutionTestsProvider,
  useSolutionTestsContext,
  useSolutionTestsConfig,
} from "@/registry/solution-tests/context";
export type {
  SolutionTestsConfig,
  ResolvedSolutionTestsConfig,
  SolutionTestEventMap,
  SolutionTestEventName,
  TrackSolutionTestEvent,
} from "@/registry/solution-tests/config";
export {
  makeRenderer,
  genericRenderer,
  resolveEvaluatorRenderer,
  GENERIC_RENDERER,
  JSON_SIMILARITY_EVALUATOR_ID,
  LLM_JUDGE_EVALUATOR_ID,
  IXP_EXTRACTION_EVALUATOR_ID,
  CASE_EVALUATION_EVALUATOR_ID,
} from "@/registry/solution-tests/evaluators/registry";
export type {
  EvaluatorRenderer,
  EvaluatorRenderers,
  EvaluatorRenderArgs,
  EvaluatorResultProps,
} from "@/registry/solution-tests/evaluators/registry";
export {
  makeProcessOutputRenderer,
  resolveProcessOutputRenderer,
} from "@/registry/solution-tests/outputs/registry";
export type {
  ProcessOutputRenderer,
  ProcessOutputRenderers,
  ProcessOutputRenderArgs,
  ProcessOutputProps,
} from "@/registry/solution-tests/outputs/registry";
export { ProcessOutputView } from "@/registry/solution-tests/outputs/process-output-view";
export { BaselineCompare } from "@/registry/solution-tests/baseline-compare";
export type { BaselineCompareRow } from "@/registry/solution-tests/baseline-compare";
export { VersionDeltaGlyph } from "@/registry/solution-tests/version-delta-glyph";
export { versionDelta } from "@/registry/solution-tests/utils";
export type { VersionDelta } from "@/registry/solution-tests/utils";
export {
  IxpOutputResult,
  IXP_OUTPUT_RENDERER,
} from "@/registry/solution-tests/outputs/ixp-extraction/ixp-output-result";
export { IxpOutputSchema } from "@/registry/solution-tests/outputs/ixp-extraction/schema";
export {
  CaseEvaluationOutputResult,
  CASE_EVALUATION_OUTPUT_RENDERER,
} from "@/registry/solution-tests/outputs/case-evaluation/case-evaluation-output";
export { CaseEvaluationOutputSchema } from "@/registry/solution-tests/outputs/case-evaluation/schema";
export type {
  CaseEvaluationOutput,
  EvaluationRecord,
} from "@/registry/solution-tests/outputs/case-evaluation/schema";
export type {
  IxpOutput,
  IxpDocumentExtraction,
  IxpExtractionGroup,
  IxpFieldValue,
} from "@/registry/solution-tests/outputs/ixp-extraction/schema";
export {
  SolutionTestStatus,
  RunStatus,
  RunResultStatus,
  JobRole,
} from "@/registry/solution-tests/types";
export type {
  SolutionTest,
  SolutionTestJob,
  SolutionTestRun,
  SolutionTestBatchRun,
  SolutionTestRunResult,
  UserMessageItem,
  ResultAttachmentField,
} from "@/registry/solution-tests/types";
export type { RunConfirmTarget } from "@/registry/solution-tests/solution-tests-view";
export { RunDetailsView } from "@/registry/solution-tests/run-details-view";
export type {
  BaselineJobMap,
  RunDetailsViewProps,
} from "@/registry/solution-tests/run-details-view";
export { ExpandedAgentsView } from "@/registry/solution-tests/expanded-agents-view";
export type { ExpandedAgentsViewProps } from "@/registry/solution-tests/expanded-agents-view";
export { ExpandedRunTestsView } from "@/registry/solution-tests/expanded-run-tests-view";
export type { ExpandedRunTestsViewProps } from "@/registry/solution-tests/expanded-run-tests-view";
export {
  CaseEvaluationDetailsSchema,
  EvaluationPairStatus,
  SummaryVerdict,
} from "@/registry/solution-tests/evaluators/case-evaluation/schema";
export type {
  CaseEvaluationDetails,
  EvaluationPair,
  EvaluationView,
} from "@/registry/solution-tests/evaluators/case-evaluation/schema";
export {
  IxpDetailsSchema,
  IxpDocStatus,
  IxpVerdict,
} from "@/registry/solution-tests/evaluators/ixp-extraction/schema";
export type {
  IxpDetails,
  IxpDocument,
  IxpField,
  IxpProvenance,
  IxpVerdictValue,
} from "@/registry/solution-tests/evaluators/ixp-extraction/schema";
