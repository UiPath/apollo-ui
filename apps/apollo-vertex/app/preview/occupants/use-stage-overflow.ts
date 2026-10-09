import { type RefObject, useEffect, useState } from "react";
import { overflowProblems } from "@/lib/overflow-problems";
import { afterLayout, settled } from "./overflow";
import type { WorkbenchView } from "./workbench-url-state";

/** What overflows in the occupant on the stage, at the width it was measured at. */
export interface StageOverflow {
  width: number;
  problems: string[];
}

/**
 * Whether the occupant on the stage overflows right now, measured after
 * layout, and after any resize has finished animating.
 */
export function useStageOverflow(
  stageRef: RefObject<HTMLDivElement | null>,
  /** The surface's inner element, where the occupant renders. */
  inner: string | undefined,
  view: WorkbenchView,
): StageOverflow | null {
  const [overflow, setOverflow] = useState<StageOverflow | null>(null);
  useEffect(() => {
    let cancelled = false;
    void afterLayout(() =>
      inner
        ? stageRef.current?.querySelector(
            `[data-slot=occupant-fixture] ${inner}`,
          )
        : null,
    ).then(async (found) => {
      // Measure once the resize has finished animating, not mid-transition.
      const fixture = found?.closest("[data-slot=occupant-fixture]");
      if (fixture) await settled(fixture);
      if (cancelled) return;
      setOverflow(
        found ? { width: view.width, problems: overflowProblems(found) } : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [
    stageRef,
    inner,
    view.occupant,
    view.surface,
    view.sample,
    view.state,
    view.theme,
    view.width,
  ]);
  return overflow;
}
