"use client";

import type { SolutionTestRun } from "./types";
import { versionDelta } from "./utils";
import { VersionDeltaGlyph } from "./version-delta-glyph";

/** A run's configuration version, flagged when it moved from the baseline's. */
export const ConfigVersionValue = ({ run }: { run: SolutionTestRun }) => {
  const { direction } = versionDelta(
    run.BaselineConfigVersion,
    run.ConfigVersion,
  );

  return (
    <span className="inline-flex items-center gap-1">
      {run.ConfigVersion ?? "-"}
      <VersionDeltaGlyph
        direction={direction}
        baseline={run.BaselineConfigVersion}
      />
    </span>
  );
};
