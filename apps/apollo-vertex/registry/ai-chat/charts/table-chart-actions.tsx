"use client";

import { Code, Download, LayoutDashboard, Maximize2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/registry/button/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/tooltip/tooltip";

interface TableChartActionsProps {
  onFullscreen: () => void;
  onExportCsv: () => void;
  onViewDefinition: () => void;
  onSaveToDashboard: () => void;
}

export function TableChartActions({
  onFullscreen,
  onExportCsv,
  onViewDefinition,
  onSaveToDashboard,
}: TableChartActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onFullscreen}
            aria-label={t("chart_fullscreen")}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chart_fullscreen")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onExportCsv}
            aria-label={t("chart_export_csv")}
          >
            <Download className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chart_export_csv")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onViewDefinition}
            aria-label={t("chart_view_definition")}
          >
            <Code className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chart_view_definition")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSaveToDashboard}
            aria-label={t("chart_save_to_dashboard")}
          >
            <LayoutDashboard className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("chart_save_to_dashboard")}</TooltipContent>
      </Tooltip>
    </div>
  );
}
