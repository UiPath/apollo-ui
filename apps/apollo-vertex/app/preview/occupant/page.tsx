"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { OCCUPANT_STATES } from "@/components/ui/occupant";

/**
 * Preview only: one registered occupant in one surface, for the occupant
 * checks. No template: occupants are checked against surfaces.
 *
 *   ?occupant=<name>&surface=<page-header|side-panel|content-area>
 *   &example=<name>&state=<ready|loading|empty|error|agent-updating>
 *
 * The box starts at the occupant's minWidth (plus the surface padding);
 * checks resize [data-slot=occupant-fixture] to sweep widths.
 */
function Fixture() {
  const params = useSearchParams();
  return (
    <OccupantInSurface
      occupant={params.get("occupant") ?? ""}
      surface={params.get("surface") ?? ""}
      example={params.get("example") ?? ""}
      state={OCCUPANT_STATES.find((s) => s === params.get("state")) ?? "ready"}
      height={640}
    />
  );
}

export default function OccupantFixturePage() {
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-background p-8 not-prose">
      <Suspense>
        <Fixture />
      </Suspense>
    </div>
  );
}
