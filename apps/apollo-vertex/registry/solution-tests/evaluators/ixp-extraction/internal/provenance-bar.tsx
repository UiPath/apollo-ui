"use client";

import { useTranslation } from "react-i18next";
import { BaselineCompare } from "../../../baseline-compare";
import { versionDelta } from "../../../utils";
import { VersionDeltaGlyph } from "../../../version-delta-glyph";
import type { IxpProvenance } from "../schema";

export const ProvenanceBar = ({
  expected,
  actual,
}: {
  expected: IxpProvenance | null;
  actual: IxpProvenance | null;
}) => {
  const { t } = useTranslation();

  const baselineVersion = formatVersion(expected?.resolved_project_version);
  const currentVersion = formatVersion(actual?.resolved_project_version);
  const { direction } = versionDelta(
    expected?.resolved_project_version,
    actual?.resolved_project_version,
  );

  return (
    <BaselineCompare
      rows={[
        {
          label: t("ixp_taxonomy_version"),
          baseline: baselineVersion,
          current: currentVersion,
          marker: (
            <VersionDeltaGlyph
              direction={direction}
              baseline={baselineVersion}
            />
          ),
        },
        {
          label: t("ixp_extractor"),
          baseline: expected?.extractor ?? null,
          current: actual?.extractor ?? null,
          mono: true,
        },
      ]}
    />
  );
};

const formatVersion = (
  version: number | string | null | undefined,
): string | null => (version == null ? null : `v${version}`);
