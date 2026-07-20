"use client";

import type { ColumnDef } from "@tanstack/react-table";
import dynamic from "next/dynamic";
import { useState } from "react";

import { DataTableColumnHeader } from "@/components/ui/data-table";
// Import the dumb pieces directly (not the package barrel) so the demo's module
// graph never pulls in the collection hooks (and their `@tanstack/react-db` /
// vs-core deps) — same approach as the GroupMembershipGuard demo.
import { SolutionTestsProvider } from "@/registry/solution-tests/context";
import {
  SolutionTestsView,
  type RunConfirmTarget,
} from "@/registry/solution-tests/solution-tests-view";
import type {
  SolutionTest,
  SolutionTestBatchRun,
  SolutionTestJob,
  SolutionTestRun,
} from "@/registry/solution-tests/types";
import type { SolutionTestsConfig } from "@/registry/solution-tests/config";
import { ExpandedAgentsView } from "@/registry/solution-tests/expanded-agents-view";
import { ExpandedRunTestsView } from "@/registry/solution-tests/expanded-run-tests-view";
import {
  RunDetailsDialogView,
  type BaselineJobMap,
} from "@/registry/solution-tests/run-details-dialog-view";
import type { ExpandedRowData } from "@/registry/solution-tests/result-expanded-content";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { createMockDb } from "./solution-tests/mock-db";

// oxlint-disable-next-line no-empty-function
const noop = () => {};

function getSubject(test: SolutionTest) {
  return (test.Subject ?? {}) as { Borrower?: string; LoanAmount?: number };
}

function getRunsForBatch(batchId: string, allRuns: SolutionTestRun[]) {
  return allRuns.filter((r) => r.RunBatchId === batchId);
}

/**
 * Presentational demo: renders the *dumb* `SolutionTestsView` (and the dumb
 * expanded views via its render-props) with in-memory mock data and local
 * handlers. It never calls the data hooks or vs-core — the mock db is the only
 * data source.
 */
function SolutionTestsTemplateContent() {
  // Stable seed data; identity must survive re-renders now that the demo is
  // interactive. Writes are still no-ops (read-only demo).
  const [db] = useState(() => createMockDb());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [runConfirm, setRunConfirm] = useState<RunConfirmTarget | null>(null);
  // Expected-output JSON viewer (agents expansion).
  const [viewing, setViewing] = useState<{
    job: SolutionTestJob;
    data: unknown;
    loading: boolean;
  } | null>(null);
  // Run-details dialog (runs expansion).
  const [detailsRun, setDetailsRun] = useState<{
    run: SolutionTestRun;
    subjectId: string;
  } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const baselineJobsByTest = new Map<string, SolutionTestJob[]>();
  for (const job of db.jobs) {
    const list = baselineJobsByTest.get(job.SolutionTestId) ?? [];
    list.push(job);
    baselineJobsByTest.set(job.SolutionTestId, list);
  }

  const subjectColumns: ColumnDef<SolutionTest>[] = [
    {
      accessorKey: "SubjectId",
      meta: { displayName: "Loan ID" },
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Loan ID" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">{row.original.SubjectId}</span>
      ),
      enableSorting: true,
    },
    {
      id: "borrower",
      meta: { displayName: "Borrower" },
      accessorFn: (test) => getSubject(test).Borrower,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Borrower" />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {getSubject(row.original).Borrower ?? "—"}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "loanAmount",
      meta: { displayName: "Loan amount" },
      accessorFn: (test) => getSubject(test).LoanAmount,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Loan amount" />
      ),
      cell: ({ row }) => {
        const amount = getSubject(row.original).LoanAmount;
        return (
          <span className="text-sm">
            {amount == null ? "—" : `$${amount.toLocaleString()}`}
          </span>
        );
      },
      enableSorting: true,
    },
  ];

  const config: SolutionTestsConfig = {
    subjectColumns,
    subjectNoun: { singular: "Loan", plural: "Loans" },
  };

  return (
    <LocaleProvider>
      {/* Presentational demo: writes are no-ops, so trigger deps are stubs. */}
      <SolutionTestsProvider
        config={config}
        triggerBaseUrl=""
        getToken={() => null}
      >
        <SolutionTestsView
          tests={db.tests}
          batchRuns={db.batchRuns}
          loading={false}
          hasActiveRuns={false}
          runningAll={false}
          runningSelected={false}
          runningTestId={null}
          togglingTestId={null}
          isDeleting={false}
          forceStoppingBatchId={null}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          runConfirm={runConfirm}
          setRunConfirm={setRunConfirm}
          onConfirmRun={() => setRunConfirm(null)}
          onToggleActive={noop}
          onDeleteTest={() => setDeleteConfirmId(null)}
          onForceStopBatch={noop}
          renderExpandedTest={(test: SolutionTest) => {
            const baselines = baselineJobsByTest.get(test.Id) ?? [];
            // Jobs with no mock expected output render as "no output".
            const noOutputJobIds = new Set(
              baselines
                .filter((job) => db.jobOutputs[job.Id] == null)
                .map((job) => job.Id),
            );
            return (
              <ExpandedAgentsView
                test={test}
                baselines={baselines}
                isLoading={false}
                noOutputJobIds={noOutputJobIds}
                viewing={viewing}
                onViewExpected={(job) =>
                  setViewing({
                    job,
                    data: db.jobOutputs[job.Id] ?? null,
                    loading: false,
                  })
                }
                onCloseViewer={() => setViewing(null)}
              />
            );
          }}
          renderExpandedRun={(batch: SolutionTestBatchRun) => {
            const results = detailsRun
              ? db.results.filter(
                  (r) => r.SolutionTestRunId === detailsRun.run.Id,
                )
              : [];
            const baselineJobMap: BaselineJobMap = detailsRun
              ? new Map(
                  db.jobs
                    .filter(
                      (j) => j.SolutionTestId === detailsRun.run.SolutionTestId,
                    )
                    .map((j) => [
                      j.ProcessName,
                      { id: j.Id, sourceRunResultId: j.SourceRunResultId },
                    ]),
                )
              : new Map();
            const rowData: Record<string, ExpandedRowData> = {};
            for (const id of expandedRows) {
              const att = db.resultAttachments[id];
              if (!att) continue;
              rowData[id] = {
                loading: false,
                expected: att.ExpectedOutput,
                expectedInput: att.ExpectedInput,
                actual: att.ActualOutput,
                actualInput: att.ActualInput,
                evaluatorResults: att.EvaluatorResults,
              };
            }
            return (
              <ExpandedRunTestsView
                runs={getRunsForBatch(batch.Id, db.runs)}
                tests={db.tests}
                stoppingRunId={null}
                onOpenDetails={(run, subjectId) =>
                  setDetailsRun({ run, subjectId })
                }
                onForceStop={noop}
                detailsDialog={
                  detailsRun?.run.RunBatchId === batch.Id && (
                    <RunDetailsDialogView
                      open
                      onClose={() => {
                        setDetailsRun(null);
                        setExpandedRows(new Set());
                      }}
                      subjectId={detailsRun?.subjectId ?? ""}
                      results={results}
                      isLoading={false}
                      baselineJobMap={baselineJobMap}
                      expandedRows={expandedRows}
                      rowData={rowData}
                      adoptingResultId={null}
                      updatingResultId={null}
                      removingBaselineId={null}
                      onToggleRow={(result) =>
                        setExpandedRows((prev) => {
                          const next = new Set(prev);
                          if (next.has(result.Id)) {
                            next.delete(result.Id);
                          } else {
                            next.add(result.Id);
                          }
                          return next;
                        })
                      }
                      onAdopt={noop}
                      onUpdateBaseline={noop}
                      onRemoveBaseline={noop}
                    />
                  )
                }
              />
            );
          }}
        />
      </SolutionTestsProvider>
    </LocaleProvider>
  );
}

export const SolutionTestsTemplate = dynamic(
  () => Promise.resolve(SolutionTestsTemplateContent),
  { ssr: false },
);
