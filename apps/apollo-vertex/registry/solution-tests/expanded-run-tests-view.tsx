"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Info, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { SolutionTest, SolutionTestRun } from "./types";
import { renderValueOrEmptyState } from "@/lib/renderValueOrEmptyState";
import { defaultRunStatusLabels } from "./constants";
import { runStatusBadgeMap } from "./status-maps";
import { isRunDone } from "./utils";
import { UserMessagesIcon } from "./user-messages-view";

export interface ExpandedRunTestsViewProps {
  runs: SolutionTestRun[];
  tests: SolutionTest[];
  stoppingRunId: string | null;
  onOpenDetails: (run: SolutionTestRun, subjectId: string) => void;
  onForceStop: (runId: string) => void;
  /** Rendered below the table when a run's details dialog is open. */
  detailsDialog?: ReactNode;
}

export const ExpandedRunTestsView = ({
  runs,
  tests,
  stoppingRunId,
  onOpenDetails,
  onForceStop,
  detailsDialog,
}: ExpandedRunTestsViewProps) => {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 py-2">{t("test_name")}</TableHead>
              <TableHead className="px-3 py-2">{t("score")}</TableHead>
              <TableHead className="px-3 py-2">{t("agents_passed")}</TableHead>
              <TableHead className="px-3 py-2">{t("status")}</TableHead>
              <TableHead className="w-6 px-1 py-2" />
              <TableHead className="px-3 py-2">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => {
              const test = tests.find((x) => x.Id === run.SolutionTestId);
              const subjectId = test?.SubjectId ?? run.SolutionTestId;

              return (
                <TableRow key={run.Id}>
                  <TableCell className="px-3 py-2">
                    {test?.TestName ?? subjectId}
                  </TableCell>
                  <TableCell className="px-3 py-2 font-medium">
                    {renderValueOrEmptyState(run.TestRunScore, {
                      type: "number",
                      options: { style: "percent", maximumFractionDigits: 0 },
                    })}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {`${run.JobsPassed ?? 0}/${run.JobsTotal ?? 0}`}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      variant="secondary"
                      status={runStatusBadgeMap[run.Status] ?? "info"}
                    >
                      {defaultRunStatusLabels[run.Status] ?? "Unknown"}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-6 px-1 py-2">
                    <UserMessagesIcon messages={run.UserMessages} />
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {isRunDone(run.Status) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetails(run, subjectId);
                        }}
                      >
                        <Info className="size-3" />
                        {t("details")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={stoppingRunId === run.Id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onForceStop(run.Id);
                        }}
                      >
                        {stoppingRunId === run.Id ? (
                          <Spinner className="size-3" />
                        ) : (
                          <Square className="size-3" />
                        )}
                        {t("force_stop")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {detailsDialog}
    </div>
  );
};
