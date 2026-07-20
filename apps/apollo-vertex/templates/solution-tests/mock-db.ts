/**
 * In-memory data for the Solution Tests template. Mutable so the mock adapter
 * can reflect toggles, deletes, force-stops, and runs without a backend.
 */

import {
  JobRole,
  RunResultStatus,
  RunStatus,
  SolutionTestStatus,
  type SolutionTest,
  type SolutionTestBatchRun,
  type SolutionTestJob,
  type SolutionTestRun,
  type SolutionTestRunResult,
} from "@/registry/solution-tests/types";

export interface MockDb {
  tests: SolutionTest[];
  batchRuns: SolutionTestBatchRun[];
  runs: SolutionTestRun[];
  jobs: SolutionTestJob[];
  results: SolutionTestRunResult[];
  jobOutputs: Record<string, unknown>;
  resultAttachments: Record<string, Record<string, unknown>>;
}

const warningMessages = JSON.stringify([
  {
    key: "demo_warning",
    category: "Warning",
    details: {},
    timestamp: "2026-05-30T10:00:00Z",
    message: "Baseline is older than the current solution version.",
  },
]);

const errorMessages = JSON.stringify([
  {
    key: "demo_error",
    category: "Error",
    details: {},
    timestamp: "2026-05-30T10:00:00Z",
    message: "Test creation failed: subject snapshot could not be captured.",
  },
]);

const AGENTS = [
  "Income Verification Agent",
  "Risk Scoring Agent",
  "Document Classifier Agent",
];

export function createMockDb(): MockDb {
  const tests: SolutionTest[] = [
    {
      Id: "test-1",
      TestName: "Acme Corp — Term Loan",
      VerticalSolutionVersion: "1.4.0",
      Status: SolutionTestStatus.Ready,
      IsActive: true,
      SubjectId: "LN-1001",
      Subject: { Borrower: "Acme Corp", LoanAmount: 250000 },
    },
    {
      Id: "test-2",
      TestName: "Globex LLC — Revolving Credit",
      VerticalSolutionVersion: "1.4.0",
      Status: SolutionTestStatus.Ready,
      IsActive: true,
      UserMessages: warningMessages,
      SubjectId: "LN-1002",
      Subject: { Borrower: "Globex LLC", LoanAmount: 1200000 },
    },
    {
      Id: "test-3",
      TestName: "Initech — Equipment Finance",
      VerticalSolutionVersion: "1.3.0",
      Status: SolutionTestStatus.Pending,
      IsActive: false,
      SubjectId: "LN-1003",
      Subject: { Borrower: "Initech", LoanAmount: 75000 },
    },
    {
      Id: "test-4",
      TestName: "Umbrella Inc — Bridge Loan",
      VerticalSolutionVersion: "1.4.0",
      Status: SolutionTestStatus.Error,
      IsActive: true,
      UserMessages: errorMessages,
      SubjectId: "LN-1004",
      Subject: { Borrower: "Umbrella Inc", LoanAmount: 500000 },
    },
  ];

  // Baseline jobs: test-1 has all three agents, test-2 has two, test-3/4 none.
  const jobs: SolutionTestJob[] = [];
  const jobCountByTest: Record<string, number> = {
    "test-1": 3,
    "test-2": 2,
    "test-3": 0,
    "test-4": 0,
  };
  const jobOutputs: Record<string, unknown> = {};
  for (const [testId, count] of Object.entries(jobCountByTest)) {
    for (let i = 0; i < count; i++) {
      const id = `${testId}-job-${i}`;
      jobs.push({
        Id: id,
        SolutionTestId: testId,
        JobRole: JobRole.Baseline,
        ProcessName: AGENTS[i],
        ProcessVersion: "1.4.0",
        SourceRunResultId: `${testId}-r0-res-${i}`,
      });
      // Document Classifier (i === 2) has no expected output
      jobOutputs[id] =
        i === 2
          ? null
          : {
              decision: i === 0 ? "verified" : "low-risk",
              confidence: 0.93,
              fields: { reviewed: true },
            };
    }
  }

  // Three completed batches → KPI trend has multiple points.
  const batchRuns: SolutionTestBatchRun[] = [
    {
      Id: "batch-3",
      Status: RunStatus.Passed,
      OverallScore: 0.94,
      TestsPassed: 3,
      TestsTotal: 3,
      VerticalSolutionVersion: "1.4.0",
      StartedAt: "2026-06-03T09:00:00Z",
      CompletedAt: "2026-06-03T09:12:00Z",
      CreateTime: "2026-06-03T09:00:00Z",
    },
    {
      Id: "batch-2",
      Status: RunStatus.Passed,
      OverallScore: 0.88,
      TestsPassed: 2,
      TestsTotal: 3,
      VerticalSolutionVersion: "1.3.5",
      UserMessages: warningMessages,
      StartedAt: "2026-05-28T14:00:00Z",
      CompletedAt: "2026-05-28T14:15:00Z",
      CreateTime: "2026-05-28T14:00:00Z",
    },
    {
      Id: "batch-1",
      Status: RunStatus.Failed,
      OverallScore: 0.72,
      TestsPassed: 1,
      TestsTotal: 3,
      VerticalSolutionVersion: "1.3.0",
      StartedAt: "2026-05-20T11:00:00Z",
      CompletedAt: "2026-05-20T11:09:00Z",
      CreateTime: "2026-05-20T11:00:00Z",
    },
  ];

  // One run per (batch, active test). Results vary to exercise every branch.
  const runs: SolutionTestRun[] = [];
  const results: SolutionTestRunResult[] = [];
  const resultAttachments: Record<string, Record<string, unknown>> = {};
  const activeTests = tests.filter(
    (x) => x.Status === SolutionTestStatus.Ready,
  );

  batchRuns.forEach((batch, bIdx) => {
    activeTests.forEach((test, tIdx) => {
      const runId = `${batch.Id}-run-${test.Id}`;
      // one failure in oldest batch
      const passed = !(bIdx === 2 && tIdx === 0);
      runs.push({
        Id: runId,
        SolutionTestId: test.Id,
        RunBatchId: batch.Id,
        Status: passed ? RunStatus.Passed : RunStatus.Failed,
        VerticalSolutionVersion: batch.VerticalSolutionVersion,
        TestRunScore: passed ? 0.95 : 0.61,
        JobsPassed: passed ? 3 : 1,
        JobsTotal: 3,
        StartedAt: batch.StartedAt,
        CompletedAt: batch.CompletedAt,
        CreateTime: batch.CreateTime,
      });

      // Per-agent results for every run so each detail page has content.
      const statuses = [
        RunResultStatus.Passed,
        RunResultStatus.Failed,
        RunResultStatus.NoBaseline,
      ];
      AGENTS.forEach((agent, i) => {
        const resId = `${runId}-res-${i}`;
        const status = passed ? RunResultStatus.Passed : statuses[i];
        const result: SolutionTestRunResult = {
          Id: resId,
          SolutionTestRunId: runId,
          ProcessName: agent,
          ProcessVersion: i === 1 ? "1.4.1" : "1.4.0",
          BaselineProcessVersion: "1.4.0",
          Status: status,
        };
        if (status === RunResultStatus.Passed) {
          result.Score = 0.97;
        } else if (status === RunResultStatus.Failed) {
          result.Score = 0.55;
        }
        if (i === 1) {
          result.UserMessages = warningMessages;
        }
        results.push(result);
        resultAttachments[resId] = {
          ExpectedOutput: { decision: "verified", confidence: 0.93 },
          ActualOutput: {
            decision: status === RunResultStatus.Failed ? "review" : "verified",
            confidence: status === RunResultStatus.Failed ? 0.55 : 0.97,
          },
          ExpectedInput: { applicantId: test.SubjectId },
          ActualInput: { applicantId: test.SubjectId },
          EvaluatorResults: {
            "uipath-json-similarity": {
              score: status === RunResultStatus.Failed ? 0.55 : 0.97,
              details: {
                justification:
                  status === RunResultStatus.Failed
                    ? "Output diverged from baseline on the decision field."
                    : "Output matched the baseline within tolerance.",
              },
            },
            "uipath-llm-judge-output-semantic-similarity": {
              score: status === RunResultStatus.Failed ? 0.6 : 0.95,
              details: { justification: "Semantic intent largely preserved." },
            },
          },
        };
      });
    });
  });

  return {
    tests,
    batchRuns,
    runs,
    jobs,
    results,
    jobOutputs,
    resultAttachments,
  };
}
