"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { EMPTY_VALUE } from "../../../constants";
import { versionDelta } from "../../../utils";
import { VersionDeltaGlyph } from "../../../version-delta-glyph";
import type { IxpProvenance } from "../schema";

// Shows baseline and new-run values side by side rather than collapsing to a
// single value, so an unchanged version reads as unchanged on its own.
export const ProvenanceBar = ({
  expected,
  actual,
}: {
  expected: IxpProvenance | null;
  actual: IxpProvenance | null;
}) => {
  const { t } = useTranslation();
  if (!expected && !actual) return null;

  const baselineVersion = expected?.resolved_project_version;
  const currentVersion = actual?.resolved_project_version;
  const { direction } = versionDelta(baselineVersion, currentVersion);

  return (
    <div className="grid w-fit grid-cols-[max-content_max-content_max-content] items-center gap-x-6 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <ProvenanceRow
        label={t("ixp_taxonomy_version")}
        baseline={formatVersion(baselineVersion)}
        current={formatVersion(currentVersion)}
        glyph={
          <VersionDeltaGlyph
            direction={direction}
            baseline={formatVersion(baselineVersion)}
          />
        }
      />
      <ProvenanceRow
        label={t("ixp_extractor")}
        baseline={expected?.extractor ?? null}
        current={actual?.extractor ?? null}
        mono
      />
    </div>
  );
};

const ProvenanceRow = ({
  label,
  baseline,
  current,
  mono = false,
  glyph = null,
}: {
  label: string;
  baseline: string | null;
  current: string | null;
  mono?: boolean;
  glyph?: ReactNode;
}) => {
  const { t } = useTranslation();
  if (baseline == null && current == null) return null;

  const valueClass = cn("text-foreground", mono && "font-mono");

  return (
    <div className="contents">
      <span className="font-medium">{label}</span>
      <span>
        {`${t("ixp_baseline")}: `}
        <span className={valueClass}>{baseline ?? EMPTY_VALUE}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        {`${t("ixp_new")}: `}
        <span className={valueClass}>{current ?? EMPTY_VALUE}</span>
        {glyph}
      </span>
    </div>
  );
};

const formatVersion = (
  version: number | string | null | undefined,
): string | null => (version == null ? null : `v${version}`);
