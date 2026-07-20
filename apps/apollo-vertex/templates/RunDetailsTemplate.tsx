"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Import the dumb view directly (not the package barrel) so the demo's module
// graph never pulls in the collection hooks (and their `@tanstack/react-db` /
// vs-core deps) — same approach as the SolutionTestsTemplate demo.
import type { SolutionTestsConfig } from "@/registry/solution-tests/config";
import { SolutionTestsProvider } from "@/registry/solution-tests/context";
import {
  RunDetailsView,
  type BaselineJobMap,
} from "@/registry/solution-tests/run-details-view";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";
import { createMockDb } from "./solution-tests/mock-db";

// oxlint-disable-next-line no-empty-function
const noop = () => {};

const config: SolutionTestsConfig = {
  subjectNoun: { singular: "Loan", plural: "Loans" },
};

/**
 * Presentational demo of the run-details page: renders the dumb `RunDetailsView`
 * against the shared mock db with agent selection wired up. Writes are no-ops.
 */
function RunDetailsTemplateContent() {
  const [db] = useState(() => createMockDb());
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);

  // Every run has per-agent results; drive the example off the first one.
  const run = db.runs[0];
  if (!run) return null;

  const results = db.results.filter((res) => res.SolutionTestRunId === run.Id);
  const test = db.tests.find((tst) => tst.Id === run.SolutionTestId);
  const subjectId = test?.SubjectId ?? run.SolutionTestId;

  const baselineJobMap: BaselineJobMap = new Map(
    db.jobs
      .filter((j) => j.SolutionTestId === run.SolutionTestId)
      .map((j) => [
        j.ProcessName,
        { id: j.Id, sourceRunResultId: j.SourceRunResultId },
      ]),
  );

  // Default the demo to the agent whose tested version differs from baseline so
  // the version-change indicator is visible without interaction.
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
    <LocaleProvider>
      {/* Presentational demo: writes are no-ops, so trigger deps are stubs. */}
      <SolutionTestsProvider
        config={config}
        triggerBaseUrl=""
        getToken={() => null}
      >
        <div className="h-full">
          <RunDetailsView
            subjectId={subjectId}
            run={run}
            results={results}
            isLoading={false}
            baselineJobMap={baselineJobMap}
            selectedResultId={selectedId}
            selectedRowData={selectedRowData}
            adoptingResultId={null}
            updatingResultId={null}
            removingBaselineId={null}
            onBack={noop}
            onSelect={setSelectedResultId}
            onAdopt={noop}
            onUpdateBaseline={noop}
            onRemoveBaseline={noop}
          />
        </div>
      </SolutionTestsProvider>
    </LocaleProvider>
  );
}

export const RunDetailsTemplate = dynamic(
  () => Promise.resolve(RunDetailsTemplateContent),
  { ssr: false },
);
