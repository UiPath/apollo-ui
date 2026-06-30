"use client";

import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IxpProvenance } from "../schema";

const version = (p: IxpProvenance | null | undefined) =>
  p?.resolved_project_version == null
    ? null
    : String(p.resolved_project_version);

/** Informational banner showing which IXP taxonomy version / extractor produced
 * the baseline vs the new run, highlighting a version change. */
export const ProvenanceBar = ({
  expected,
  actual,
}: {
  expected: IxpProvenance | null | undefined;
  actual: IxpProvenance | null | undefined;
}) => {
  const { t } = useTranslation();
  if (!expected && !actual) return null;

  const ev = version(expected);
  const av = version(actual);
  const versionChanged = ev != null && av != null && ev !== av;
  const extractor = actual?.extractor ?? expected?.extractor ?? null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <span className="font-medium text-muted-foreground">
        {t("ixp_taxonomy_version")}
      </span>
      {versionChanged ? (
        <span className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{`v${ev}`}</span>
          <ArrowRight
            className="size-3 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="font-semibold">{`v${av}`}</span>
          <Badge status="warning" variant="secondary">
            {t("ixp_version_changed")}
          </Badge>
        </span>
      ) : (
        <span className="font-semibold">{`v${av ?? ev ?? "—"}`}</span>
      )}
      {extractor && (
        <span className="text-muted-foreground">
          {`${t("ixp_extractor")}: `}
          <span className="font-mono">{extractor}</span>
        </span>
      )}
    </div>
  );
};
