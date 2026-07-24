"use client";

import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SolutionTestStatus } from "./types";
import type { SolutionTest, SolutionTestJob } from "./types";
import { ProcessResultsViewerDialog } from "./process-results-viewer-dialog";
import { ProcessOutputView } from "./outputs/process-output-view";

export interface ExpandedAgentsViewProps {
  test: SolutionTest;
  baselines: SolutionTestJob[];
  isLoading: boolean;
  /** Jobs whose expected-output fetch came back empty (rendered as "no output"). */
  noOutputJobIds: Set<string>;
  viewing: { job: SolutionTestJob; data: unknown; loading: boolean } | null;
  onViewExpected: (job: SolutionTestJob) => void;
  onCloseViewer: () => void;
}

export const ExpandedAgentsView = ({
  test,
  baselines,
  isLoading,
  noOutputJobIds,
  viewing,
  onViewExpected,
  onCloseViewer,
}: ExpandedAgentsViewProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="rounded-md border bg-background">
          <div className="border-b px-3 py-2 grid grid-cols-3 gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
          {["row-0", "row-1", "row-2"].map((rowKey) => (
            <div
              key={rowKey}
              className="border-b last:border-0 px-3 py-3 grid grid-cols-3 gap-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-8 w-28" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (test.Status === SolutionTestStatus.Error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{t("test_creation_failed")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (baselines.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        {t("no_agents_configured")}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-3 py-2">{t("agent_name")}</TableHead>
              <TableHead className="px-3 py-2">{t("version")}</TableHead>
              <TableHead className="px-3 py-2">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {baselines.map((job) => {
              const hasNoOutput = noOutputJobIds.has(job.Id);
              return (
                <TableRow key={job.Id}>
                  <TableCell className="px-3 py-2">{job.ProcessName}</TableCell>
                  <TableCell className="px-3 py-2 text-muted-foreground">
                    {job.ProcessVersion ?? "-"}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    {hasNoOutput ? (
                      <span className="text-sm text-muted-foreground">
                        {t("agent_has_no_expected_output")}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewExpected(job);
                        }}
                      >
                        <Eye className="size-3" />
                        {t("view_expected")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {viewing && (
        <ProcessResultsViewerDialog
          open
          onClose={onCloseViewer}
          title={t("expected_output_for", { name: viewing.job.ProcessName })}
          data={viewing.data}
          loading={viewing.loading}
          renderData={(data) => (
            <ProcessOutputView
              agentId={viewing.job.AgentId}
              processName={viewing.job.ProcessName}
              output={data}
              variant="bare"
            />
          )}
        />
      )}
    </div>
  );
};
