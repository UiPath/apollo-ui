"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { OccupantInSurface } from "@/app/_components/occupant-in-surface";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import type { ExampleRole } from "@/lib/occupant-entry";
import { afterLayout, overflowProblems, settled } from "./overflow";
import { specFor, WIDTH_RANGE } from "./workbench-url-state";

/** How close the floor search gets, in px, like measure:occupant's step. */
const STEP = 4;

/**
 * A measured floor: the surface's outer width in px, padding included (the
 * same box as the slider), or "clips" when it always overflows.
 * WIDTH_RANGE.min means it fits even there: the floor is at most that.
 */
export type Floor = number | "clips";

interface FloorProbeProps {
  occupant: string;
  surface: string;
  sample: ExampleRole;
  onFloor: (sample: ExampleRole, floor: Floor) => void;
}

/**
 * Measures an occupant's floor in the browser, out of sight: the narrowest
 * outer width where nothing overflows, found by halving the range. The
 * same idea as pnpm measure:occupant, for one sample in one surface.
 */
export function FloorProbe({
  occupant,
  surface,
  sample,
  onFloor,
}: FloorProbeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const report = useEffectEvent((floor: Floor) => onFloor(sample, floor));
  useEffect(() => {
    const spec = specFor(occupant);
    const host = SURFACE_HOSTS[surface];
    if (!spec || !host) return;
    let cancelled = false;
    let target: { fixture: HTMLElement; inner: Element } | null = null;
    const clipsAt = async (width: number) => {
      if (!target) return true;
      target.fixture.style.width = `${width}px`;
      await settled(target.fixture);
      return overflowProblems(target.inner).length > 0;
    };
    // Clips at `clips`, fits at `fits`: halve the gap until it's one step.
    const narrow = async (clips: number, fits: number): Promise<number> => {
      if (fits - clips <= STEP || cancelled) return fits;
      const middle = Math.round((fits + clips) / 2);
      return (await clipsAt(middle))
        ? narrow(middle, fits)
        : narrow(clips, middle);
    };
    const search = async (): Promise<Floor> => {
      target = await afterLayout(() => {
        const fixture = ref.current?.querySelector<HTMLElement>(
          "[data-slot=occupant-fixture]",
        );
        const inner = fixture?.querySelector(host.inner);
        return fixture && inner && !cancelled ? { fixture, inner } : null;
      });
      const widest = WIDTH_RANGE.max;
      if (await clipsAt(widest)) return "clips";
      if (!(await clipsAt(WIDTH_RANGE.min))) return WIDTH_RANGE.min;
      return narrow(WIDTH_RANGE.min, widest);
    };
    void search().then((floor) => {
      if (!cancelled) report(floor);
    });
    return () => {
      cancelled = true;
    };
  }, [occupant, surface]);
  return (
    <div ref={ref}>
      <OccupantInSurface
        occupant={occupant}
        surface={surface}
        example={sample}
        height={560}
      />
    </div>
  );
}
