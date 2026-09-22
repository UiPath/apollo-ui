/**
 * Presentational Solution Tests API. No vs-core or @tanstack/react-db imports.
 *
 * Smart containers and collection hooks live at
 * `@uipath/apollo-vertex/solution-tests/data`.
 *
 * Wrap `<SolutionTests />` (from `/data`) in a `<SolutionTestsProvider
 * triggerBaseUrl getToken config>`:
 *  - reads come from the collection-backed hooks (the consumer ensures the
 *    `UiPathST*` entity collections exist on their vs-core solution).
 *  - writes POST to `triggerBaseUrl`, authenticated with `getToken`.
 *  - `config` (SolutionTestsConfig) parameterizes the subject entity columns
 *    and navigation.
 *
 * `SolutionTestsView` is the dumb presentational view (data + callbacks via
 * props) for consumers who want to supply their own data plumbing or mocks.
 */

export { SolutionTestsView } from './solution-tests-view';
export type { SolutionTestsViewProps } from './solution-tests-view';
export { SaveAsTestButton } from './save-as-test-button';
export { SolutionTestActionError } from './errors';
export type { ActionFailure } from './errors';
export {
  SolutionTestsProvider,
  useSolutionTestsContext,
  useSolutionTestsConfig,
} from './context';
export type {
  SolutionTestsConfig,
  ResolvedSolutionTestsConfig,
  SolutionTestEventMap,
  SolutionTestEventName,
  TrackSolutionTestEvent,
} from './config';
export {
  makeRenderer,
  genericRenderer,
  resolveEvaluatorRenderer,
  GENERIC_RENDERER,
  JSON_SIMILARITY_EVALUATOR_ID,
  LLM_JUDGE_EVALUATOR_ID,
  IXP_EXTRACTION_EVALUATOR_ID,
} from './evaluators/registry';
export type {
  EvaluatorRenderer,
  EvaluatorRenderers,
  EvaluatorRenderArgs,
  EvaluatorResultProps,
} from './evaluators/registry';
export {
  makeProcessOutputRenderer,
  resolveProcessOutputRenderer,
} from './outputs/registry';
export type {
  ProcessOutputRenderer,
  ProcessOutputRenderers,
  ProcessOutputRenderArgs,
  ProcessOutputProps,
} from './outputs/registry';
export { ProcessOutputView } from './outputs/process-output-view';
export {
  IxpOutputResult,
  IXP_OUTPUT_RENDERER,
} from './outputs/ixp-extraction/ixp-output-result';
export { IxpOutputSchema } from './outputs/ixp-extraction/schema';
export type {
  IxpOutput,
  IxpDocumentExtraction,
  IxpExtractionGroup,
  IxpFieldValue,
} from './outputs/ixp-extraction/schema';
export {
  SolutionTestStatus,
  RunStatus,
  RunResultStatus,
  JobRole,
} from './types';
export type {
  SolutionTest,
  SolutionTestJob,
  SolutionTestRun,
  SolutionTestBatchRun,
  SolutionTestRunResult,
  UserMessageItem,
  ResultAttachmentField,
} from './types';

export { ExpandedAgentsView } from './expanded-agents-view';
export type { ExpandedAgentsViewProps } from './expanded-agents-view';
export { ExpandedRunTestsView } from './expanded-run-tests-view';
export type { ExpandedRunTestsViewProps } from './expanded-run-tests-view';
