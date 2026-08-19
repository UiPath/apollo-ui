"use client";

import { EvidenceChips, type EvidenceItem } from "../AgentSummary";
import { CHECK_LABEL, type DecisionCheck } from "./data";

/**
 * The band ("What I checked" / count) and the checks as a wrapping chip
 * row. A thin wrapper over the shared `EvidenceChips` (see the report):
 * this file only maps `DecisionCheck`'s own shape onto the generic
 * evidence shape and builds the "N of M cleared" heading, the rendering
 * itself lives in one place. Pass icons stay neutral so exception is the
 * only color in this row, amber (the warning token) marking an exception
 * only means something if nothing else here is also colored. The count
 * and the chip row's own length are always computed from `checks`, never
 * an authored number or a fixed four (Chunk C2: `checks` can be any
 * record's own set now, see `buildChecks`) — this component needed no
 * change at all to accept that, since it never assumed a length. Labels
 * still come from one shared map (`CHECK_LABEL`), just with more entries
 * now, not a second per-check mechanism (retires the C1 cleanup's
 * `DecisionCheck.label` override — see the report).
 */
export function DecisionChecks({ checks }: { checks: DecisionCheck[] }) {
  const cleared = checks.filter((check) => check.status === "pass").length;
  const items: EvidenceItem[] = checks.map((check) => ({
    key: check.key,
    label: CHECK_LABEL[check.key] ?? check.key,
    status: check.status,
    detail: check.detail,
  }));

  return (
    <EvidenceChips
      heading={
        <>
          <span className="font-medium text-foreground">What I checked</span>
          <span className="text-xs text-muted-foreground">
            · {cleared} of {checks.length} cleared
          </span>
        </>
      }
      items={items}
    />
  );
}
