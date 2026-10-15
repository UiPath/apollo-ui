"use client";

import { Info } from "lucide-react";
import { useVertexTranslation } from "@/lib/vertex-translation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EMPTY_VALUE } from "./constants";
import { RunResultStatus, type SolutionTestRunResult } from "./types";
import { versionDelta } from "./utils";
import { VersionDeltaGlyph } from "./version-delta-glyph";

// A changed version gets a dot, not a warning: a new version is the usual
// reason to re-run.
export const VersionDetails = ({
  result,
}: {
  result: SolutionTestRunResult;
}) => {
  const { t } = useVertexTranslation();
  const status = result.Status;
  const showBaselineVersion = status !== RunResultStatus.NoBaseline;
  const showActualVersion = status !== RunResultStatus.Missing;
  const { changed, direction } = versionDelta(
    result.BaselineProcessVersion,
    result.ProcessVersion,
  );
  const versionChanged = showBaselineVersion && showActualVersion && changed;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          data-vs-track="version_details"
          aria-label={t("version_details")}
          className="relative text-muted-foreground hover:text-foreground"
        >
          <Info className="size-3.5" aria-hidden="true" />
          {versionChanged && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-info ring-1 ring-background"
            />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {versionChanged && (
          <p className="mb-1 font-medium">
            {t("version_changed_since_baseline")}
          </p>
        )}
        <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
          <dt>{t("process_name")}</dt>
          <dd>{result.ProcessName}</dd>
          <dt>{t("baseline_version")}</dt>
          <dd>
            {showBaselineVersion
              ? (result.BaselineProcessVersion ?? "-")
              : EMPTY_VALUE}
          </dd>
          <dt>{t("tested_version")}</dt>
          <dd className="inline-flex items-center gap-1">
            {showActualVersion ? (result.ProcessVersion ?? "-") : EMPTY_VALUE}
            {versionChanged && <VersionDeltaGlyph direction={direction} />}
          </dd>
        </dl>
      </TooltipContent>
    </Tooltip>
  );
};
