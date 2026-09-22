/**
 * The Solution Tests write surface — all API-trigger mutations. Each rejects on
 * failure; the caller surfaces the error. Built by `createSolutionTestActions`
 * and provided through `SolutionTestsProvider`.
 */
export interface SolutionTestsActions {
  /** Run the given tests, or all active Ready tests when omitted. */
  runTests(testIds?: string[]): Promise<void>;
  /** Create a solution test from a subject (the backend keys it as `subject_id`). */
  createTest(subjectId: string): Promise<void>;
  deleteTest(testId: string): Promise<void>;
  forceStopBatch(batchId: string): Promise<void>;
  forceStopRun(runId: string): Promise<void>;
  adoptJob(runResultId: string): Promise<void>;
  updateBaseline(runResultId: string): Promise<void>;
  removeJobBaseline(jobBaselineId: string): Promise<void>;
}
