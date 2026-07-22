/**
 * Solution Test view models — the data contracts this UI renders.
 *
 * These map to the UiPathST* family of Solution Test entities and are
 * intentionally domain-neutral. The "subject" of a test (a loan, an invoice,
 * a claim, …) is represented by the optional `SubjectId` / `Subject` fields;
 * consumers render subject-specific columns through `SolutionTestsConfig`.
 */

// ============================================================================
// Choice sets
// ============================================================================

export const SolutionTestStatus = {
  Pending: 0,
  Ready: 1,
  Error: 2,
} as const;

export type SolutionTestStatusValue =
  (typeof SolutionTestStatus)[keyof typeof SolutionTestStatus];

export const RunStatus = {
  Pending: 0,
  Running: 1,
  Passed: 2,
  Failed: 3,
  Error: 4,
  Aborted: 5,
} as const;

export type RunStatusValue = (typeof RunStatus)[keyof typeof RunStatus];

export const RunResultStatus = {
  Pending: 0,
  Passed: 1,
  Failed: 2,
  Error: 3,
  NoBaseline: 4,
  Missing: 5,
  Aborted: 6,
} as const;

export type RunResultStatusValue =
  (typeof RunResultStatus)[keyof typeof RunResultStatus];

export const JobRole = {
  EntryPoint: 0,
  Baseline: 1,
} as const;

export type JobRoleValue = (typeof JobRole)[keyof typeof JobRole];

// ============================================================================
// Entity interfaces
// ============================================================================

export interface SolutionTest {
  Id: string;
  TestName?: string;
  VerticalSolutionVersion?: string;
  Status: number;
  IsActive?: boolean;
  UserMessages?: string;
  SubjectId?: string;
  /** Arbitrary subject fields, read by consumer-supplied subject columns. */
  Subject?: Record<string, unknown>;
}

export interface SolutionTestJob {
  Id: string;
  SolutionTestId: string;
  JobRole: number;
  ProcessName: string;
  ProcessVersion?: string;
  /** Stable agent id (uipath.json#id). */
  AgentId?: string;
  SourceRunResultId?: string;
}

export interface SolutionTestRun {
  Id: string;
  SolutionTestId: string;
  RunBatchId: string;
  Status: number;
  VerticalSolutionVersion?: string;
  TestRunScore?: number;
  JobsPassed?: number;
  JobsTotal?: number;
  UserMessages?: string;
  StartedAt?: string;
  CompletedAt?: string;
  CreateTime?: string;
}

export interface SolutionTestBatchRun {
  Id: string;
  Status: number;
  OverallScore?: number;
  TestsPassed?: number;
  TestsTotal?: number;
  VerticalSolutionVersion?: string;
  UserMessages?: string;
  StartedAt?: string;
  CompletedAt?: string;
  CreateTime?: string;
}

export interface SolutionTestRunResult {
  Id: string;
  SolutionTestRunId: string;
  /** Id of the owning job; join against `UiPathSTJobs` to read its `JobRole`. */
  SolutionTestJobId?: string;
  ProcessName: string;
  ProcessVersion?: string;
  BaselineProcessVersion?: string;
  /** Stable agent id (uipath.json#id). */
  AgentId?: string;
  Status: number;
  Score?: number;
  UserMessages?: string;
  ErrorMessage?: string;
}

// ============================================================================
// User messages
// ============================================================================

export type { UserMessageItem } from "./user-messages";

// ============================================================================
// Attachments
// ============================================================================

/** Per-result attachment slots surfaced in the run-details dialog. */
export type ResultAttachmentField =
  | "ExpectedOutput"
  | "ExpectedInput"
  | "ActualOutput"
  | "ActualInput"
  | "EvaluatorResults";
