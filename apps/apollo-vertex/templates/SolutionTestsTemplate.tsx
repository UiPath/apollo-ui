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
  RunDetailsView,
  type BaselineJobMap,
} from "@/registry/solution-tests/run-details-view";
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
  // Run-details page (runs expansion → full-page agent detail view).
  const [detailsRun, setDetailsRun] = useState<{
    run: SolutionTestRun;
    subjectId: string;
  } | null>(null);
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

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

  const mainView = (
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
      renderExpandedRun={(batch: SolutionTestBatchRun) => (
        <ExpandedRunTestsView
          runs={getRunsForBatch(batch.Id, db.runs)}
          tests={db.tests}
          stoppingRunId={null}
          onOpenDetails={(run) => {
            const test = db.tests.find((x) => x.Id === run.SolutionTestId);
            setSelectedResultId(null);
            setDetailsRun({
              run,
              subjectId: test?.SubjectId ?? run.SolutionTestId,
            });
          }}
          onForceStop={noop}
        />
      )}
    />
  );

  const detailsPage = detailsRun ? renderDetailsPage(detailsRun) : null;

  return (
    <LocaleProvider>
      {/* Presentational demo: writes are no-ops, so trigger deps are stubs. */}
      <SolutionTestsProvider
        config={config}
        triggerBaseUrl=""
        getToken={() => null}
      >
        {detailsPage ? (
          <div className="h-[720px]">{detailsPage}</div>
        ) : (
          mainView
        )}
      </SolutionTestsProvider>
    </LocaleProvider>
  );

  function renderDetailsPage(target: {
    run: SolutionTestRun;
    subjectId: string;
  }) {
    const results = db.results.filter(
      (r) => r.SolutionTestRunId === target.run.Id,
    );
    const baselineJobMap: BaselineJobMap = new Map(
      db.jobs
        .filter((j) => j.SolutionTestId === target.run.SolutionTestId)
        .map((j) => [
          j.ProcessName,
          { id: j.Id, sourceRunResultId: j.SourceRunResultId },
        ]),
    );
    // Default the demo to the agent whose tested version differs from baseline
    // so the version-change indicator is visible without interaction.
    const versionChangedId = results.find(
      (r) =>
        r.BaselineProcessVersion &&
        r.ProcessVersion &&
        r.BaselineProcessVersion !== r.ProcessVersion,
    )?.Id;
    const selectedId = selectedResultId ?? versionChangedId ?? results[0]?.Id;
    const att = db.resultAttachments[selectedId ?? ""];
    const selectedRowData = att && {
      loading: false,
      expected: att.ExpectedOutput,
      expectedInput: att.ExpectedInput,
      actual: att.ActualOutput,
      actualInput: att.ActualInput,
      evaluatorResults: att.EvaluatorResults,
    };

    return (
      <RunDetailsView
        subjectId={target.subjectId}
        run={target.run}
        results={results}
        isLoading={false}
        baselineJobMap={baselineJobMap}
        selectedResultId={selectedId}
        selectedRowData={selectedRowData}
        adoptingResultId={null}
        updatingResultId={null}
        removingBaselineId={null}
        onBack={() => {
          setDetailsRun(null);
          setSelectedResultId(null);
        }}
        onSelect={setSelectedResultId}
        onAdopt={noop}
        onUpdateBaseline={noop}
        onRemoveBaseline={noop}
      />
    );
  }
}

export const SolutionTestsTemplate = dynamic(
  () => Promise.resolve(SolutionTestsTemplateContent),
  { ssr: false },
);
