"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  type DataAdapter,
  type TableChartConfiguration,
  type TableDataModel,
  TableChart,
} from "@uipath/apollo-dashboarding";
import { Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/registry/button/button";
import { Card, CardContent } from "@/registry/card/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/registry/dialog/dialog";
import { exportTableToCsv } from "./csv-export";
import { FullscreenTable, type QueryEntityFn } from "./fullscreen-table";
import { TableChartActions } from "./table-chart-actions";

const DEFAULT_TABLE_STATE = { sortBy: null } as const;

export interface ToolDefinition {
  entityName: string;
  dimensions: string[];
}

interface TableChartCardProps {
  configuration: TableChartConfiguration;
  dataModel: TableDataModel;
  dataAdapter: DataAdapter;
  toolDefinition?: ToolDefinition;
  queryEntity?: QueryEntityFn;
}

export function TableChartCard({
  configuration,
  dataModel,
  dataAdapter,
  toolDefinition,
  queryEntity,
}: TableChartCardProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDefinition, setShowDefinition] = useState(false);

  const handleExportCsv = () => {
    if (!toolDefinition) return;
    const success = exportTableToCsv(
      queryClient,
      toolDefinition.entityName,
      toolDefinition.dimensions,
      `${toolDefinition.entityName}.csv`,
    );
    if (success) {
      toast.success(t("csv_exported"));
    } else {
      toast.error(t("no_data_to_export"));
    }
  };

  const handleCopyDefinition = () => {
    if (!toolDefinition) return;
    const json = JSON.stringify(
      {
        entityName: toolDefinition.entityName,
        dimensions: toolDefinition.dimensions,
      },
      null,
      2,
    );
    void navigator.clipboard.writeText(json);
    toast.success(t("copied_to_clipboard"));
  };

  const handleSaveToDashboard = () => {
    toast.info(t("save_to_dashboard_coming_soon"));
  };

  return (
    <>
      <Card className="flex flex-col w-full h-[300px] gap-2 py-4">
        {toolDefinition && (
          <div className="flex items-center justify-between px-4">
            <span className="text-sm font-medium truncate">
              {toolDefinition.entityName}
            </span>
            <TableChartActions
              onFullscreen={() => setIsFullscreen(true)}
              onExportCsv={handleExportCsv}
              onViewDefinition={() => setShowDefinition(true)}
              onSaveToDashboard={handleSaveToDashboard}
            />
          </div>
        )}
        <CardContent className="flex-1 overflow-hidden p-0">
          <TableChart
            configuration={configuration}
            dataModel={dataModel}
            dataAdapter={dataAdapter}
            state={DEFAULT_TABLE_STATE}
            queryClient={queryClient}
          />
        </CardContent>
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent fullscreen className="flex flex-col p-6">
          <DialogHeader>
            <DialogTitle>
              {toolDefinition?.entityName ?? configuration.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {queryEntity && toolDefinition && (
              <FullscreenTable
                columns={configuration.dimensions}
                queryEntity={queryEntity}
                entityName={toolDefinition.entityName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDefinition} onOpenChange={setShowDefinition}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("chart_definition")}</DialogTitle>
          </DialogHeader>
          {toolDefinition && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("chart_entity")}
                </span>
                <span className="text-sm">{toolDefinition.entityName}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("chart_dimensions")}
                </span>
                <ul className="text-sm list-disc list-inside">
                  {toolDefinition.dimensions.map((dim) => (
                    <li key={dim}>{dim}</li>
                  ))}
                </ul>
              </div>
              <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                {JSON.stringify(
                  {
                    entityName: toolDefinition.entityName,
                    dimensions: toolDefinition.dimensions,
                  },
                  null,
                  2,
                )}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="self-end"
                onClick={handleCopyDefinition}
              >
                <Copy className="size-3.5" />
                {t("copy_to_clipboard")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
