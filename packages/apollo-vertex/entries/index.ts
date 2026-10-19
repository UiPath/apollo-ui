// =============================================================================
// @uipath/apollo-vertex - Public API
//
// Everything is exported from the package root:
//   import { Button, ApolloShell, AiChat } from "@uipath/apollo-vertex"
//
// Named ESM re-exports plus CSS-only sideEffects so bundlers can tree-shake.
// Do not add subpaths (e.g. @uipath/apollo-vertex/button).
// =============================================================================

export * from "@/registry/accordion/accordion";
export * from "@/registry/ai-caveat/ai-caveat";
export * from "@/registry/ai-glow/ai-glow";
export * from "@/registry/ai-mark/ai-mark";
export * from "@/registry/alert/alert";
export * from "@/registry/alert-dialog/alert-dialog";
export * from "@/registry/aspect-ratio/aspect-ratio";
export * from "@/registry/avatar/avatar";
export * from "@/registry/badge/badge";
export * from "@/registry/breadcrumb/breadcrumb";
export * from "@/registry/button/button";
export * from "@/registry/button-group/button-group";
export * from "@/registry/calendar/calendar";
export * from "@/registry/card/card";
export * from "@/registry/carousel/carousel";
export * from "@/registry/checkbox/checkbox";
export * from "@/registry/collapsible/collapsible";
export * from "@/registry/combobox/combobox";
export * from "@/registry/command/command";
export * from "@/registry/context-menu/context-menu";
export * from "@/registry/date-picker/date-picker";
export * from "@/registry/dialog/dialog";
export * from "@/registry/drawer/drawer";
export * from "@/registry/dropdown-menu/dropdown-menu";
export * from "@/registry/empty/empty";
export * from "@/registry/feedback-vote-widget/feedback-vote-widget";
export * from "@/registry/field/field";
export * from "@/registry/hover-card/hover-card";
export * from "@/registry/input/input";
export * from "@/registry/input-group/input-group";
export * from "@/registry/input-otp/input-otp";
export * from "@/registry/item/item";
export * from "@/registry/kbd/kbd";
export * from "@/registry/label/label";
export * from "@/registry/menubar/menubar";
export * from "@/registry/metric-card/metric-card";
export * from "@/registry/navigation-menu/navigation-menu";
export * from "@/registry/page-header/page-header";
export * from "@/registry/pagination/pagination";
export * from "@/registry/popover/popover";
export * from "@/registry/progress/progress";
export * from "@/registry/radio-group/radio-group";
export * from "@/registry/resizable/resizable";
export * from "@/registry/scroll-area/scroll-area";
export * from "@/registry/select/select";
export * from "@/registry/separator/separator";
export * from "@/registry/sheet/sheet";
export * from "@/registry/skeleton/skeleton";
export * from "@/registry/slider/slider";
export * from "@/registry/sonner/sonner";
export * from "@/registry/spinner/spinner";
export * from "@/registry/switch/switch";
export * from "@/registry/table/table";
export * from "@/registry/tabs/tabs";
export * from "@/registry/textarea/textarea";
export * from "@/registry/toggle/toggle";
export * from "@/registry/toggle-group/toggle-group";
export * from "@/registry/tooltip/tooltip";

export * from "@/registry/confidence-signal/confidence-signal";
export * from "@/registry/data-table";
// Field's FieldError is the root public symbol. Form's FieldError is a
// translated wrapper with the same name, so it is exported under an alias
// instead of renaming either implementation.
export {
  CheckboxField,
  type CheckboxFieldProps,
  FieldError as FormFieldError,
  type FieldErrorProps as FormFieldErrorProps,
  type FieldOption,
  RadioGroupField,
  type RadioGroupFieldProps,
  SelectField,
  type SelectFieldProps,
  SubmitButton,
  type SubmitButtonProps,
  SwitchField,
  type SwitchFieldProps,
  TextareaField,
  type TextareaFieldProps,
  TextField,
  type TextFieldProps,
  useAppForm,
  useFieldContext,
  useFormContext,
  useTranslatedErrors,
  withForm,
} from "@/registry/form";
export * from "@/registry/form-wizard";
export * from "@/registry/onboarding-tour-joyride";
export * from "@/registry/sidebar/sidebar";
export * from "@/registry/stepper";
export * from "@/registry/timeline";

export { useIsMobile } from "@/registry/use-mobile/use-mobile";
export {
  type UseDataTableOptions,
  useDataTable,
} from "@/registry/use-data-table/useDataTable";
export { cn } from "@/lib/utils";
export { assertDateOrString } from "@/lib/asserts/assert-date-or-string";
export { assertString } from "@/lib/asserts/assert-string";
export { addVertexTranslations } from "@/lib/i18n";

// Charts and adapters
export * from "@/registry/chart/chart";
export * from "@/registry/bar-chart/bar-chart";
export * from "@/registry/distribution-chart/distribution-chart";
export * from "@/registry/kpi-chart/kpi-chart";
export * from "@/registry/line-chart/line-chart";
export * from "@/registry/multi-line-chart/multi-line-chart";
export * from "@/registry/table-chart/table-chart";
export * from "@/registry/charts-core/charts-core";
export * from "@/registry/data-fabric-adapter/data-fabric-adapter";
export * from "@/registry/insights-adapter/insights-adapter";

// Shell
export {
  ApolloShell,
  type ApolloShellProps,
  type CompanyLogo,
  type ShellNavItem,
  type ShellSubNavItem,
} from "@/registry/shell/shell";
export {
  AuthContext,
  ShellAuthProvider,
  useAuth,
  type AuthContextValue,
  type UserInfo,
} from "@/registry/shell/shell-auth-provider";
export { LocaleProvider } from "@/registry/shell/shell-locale-provider";
export { ThemeProvider } from "@/registry/shell/shell-theme-provider";
export {
  MembershipDenied,
  VerifyingMembership,
  type MembershipDeniedProps,
} from "@/registry/shell/group-membership-screens";
export { Role } from "@/registry/shell/shell-roles";
export { STALE_TIME_MS } from "@/registry/shell/shell-constants";
export { useAccessToken } from "@/registry/shell/shell-auth-provider";
export { useTheme } from "@/registry/shell/shell-theme-provider";
export { ShellLogin } from "@/registry/shell/shell-login";
export { ShellLayout } from "@/registry/shell/shell-layout";
export { ShellSidebar } from "@/registry/shell/shell-sidebar";
export {
  ShellUserProvider,
  useUser,
  type User,
} from "@/registry/shell/shell-user-provider";
export {
  SUPPORTED_LOCALES,
  configurei18n,
  type SupportedLocale,
} from "@/lib/i18n";
export {
  STORAGE_KEYS,
  TOKEN_QUERY_KEY,
  type TokenData,
  ensureValidToken,
  getStoredIdToken,
  getTokenQueryKey,
  login,
  logout,
  resolveReturnPath,
  toCodedAppFilePath,
} from "@/lib/auth";

// Shell entities
export {
  GroupMembershipGuard,
  type GroupMembershipGuardProps,
} from "@/registry/shell/group-membership-guard";
export {
  useGroupId,
  type UseGroupIdOptions,
  type UseGroupIdResult,
} from "@/registry/shell/use-group-id";
export {
  useGroupMembers,
  type UseGroupMembersOptions,
  type UseGroupMembersResult,
} from "@/registry/shell/use-group-members";
export { useIsGroupMember } from "@/registry/shell/use-is-group-member";
export {
  useEntityDataTable,
  type UseEntityDataTableOptions,
} from "@/registry/use-data-table/useEntityDataTable";
export { useEntityColumns } from "@/registry/use-data-table/useEntityColumns";

// Feature flags
export {
  FeatureFlagContext,
  FeatureFlagProvider,
  useFeatureFlagProvider,
} from "@/registry/feature-flag-provider/feature-flag-provider";
export { FeatureFlagGuard } from "@/registry/feature-flag-guard/feature-flag-guard";
export { ProtectedFeatureRoute } from "@/registry/protected-feature-route/protected-feature-route";
export { useFeatureFlag } from "@/registry/use-feature-flag/use-feature-flag";
export type {
  FeatureFlagProviderConfig,
  FeatureFlagUserContext,
} from "@/registry/feature-flag-provider/types";

// Solution Tests
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
  SolutionTestStatusValue,
  RunStatusValue,
  RunResultStatusValue,
  JobRoleValue,
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

// Solution Tests data
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

// AI chat
export { createAgentHubConnection } from "@/registry/ai-chat/adapters/agenthub/adapter";
export type {
  AgentHubAdapterConfig,
  AgentHubVendor,
} from "@/registry/ai-chat/adapters/agenthub/adapter";
export { createConversationalAgentConnection } from "@/registry/ai-chat/adapters/conversational-agent/adapter";
export type { ConversationalAgentAdapterConfig } from "@/registry/ai-chat/adapters/conversational-agent/adapter";
export { AiChat } from "@/registry/ai-chat/components/ai-chat";
export { AiChatEmptyState } from "@/registry/ai-chat/components/ai-chat-empty-state";
export { AiChatLoading } from "@/registry/ai-chat/components/ai-chat-loading";
export { AiChatMarkdown } from "@/registry/ai-chat/components/ai-chat-markdown";
export { AiChatThinking } from "@/registry/ai-chat/components/ai-chat-thinking";
export { NoDataMessage } from "@/registry/ai-chat/charts/no-data-message";
export { AutopilotGradientIcon } from "@/registry/ai-chat/components/icons/autopilot-gradient";
export * from "@/registry/ai-chat/tools/choices";
export type { Entity } from "@/registry/ai-chat/tools/data-fabric/util/entities";
export type { JoinInput } from "@/registry/ai-chat/tools/data-fabric/util/joins";
export * from "@/registry/ai-chat/tools/data-fabric-bar";
export * from "@/registry/ai-chat/tools/data-fabric-distribution";
export * from "@/registry/ai-chat/tools/data-fabric-kpi";
export * from "@/registry/ai-chat/tools/data-fabric-line";
export * from "@/registry/ai-chat/tools/data-fabric-multi-line";
export * from "@/registry/ai-chat/tools/data-fabric-table";
export * from "@/registry/ai-chat/tools/data-fabric";
export type { MessageFeedbackType } from "@/registry/ai-chat/types";
