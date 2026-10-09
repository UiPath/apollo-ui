import { useDeferredValue, useState } from "react";
import { EXAMPLE_ROLES, type ExampleRole } from "@/lib/occupant-entry";
import type { Floor } from "./floor-probe";

/**
 * Floors, measured out of sight for every sample in the selected surface,
 * by occupant and surface. The probes wait for the stage: `probing` is
 * true only once a deferred render has caught up with a change, so a new
 * occupant shows first and is measured after, never in the same commit.
 */
export function useFloors(occupant: string, surface: string) {
  const key = `${occupant}:${surface}`;
  const caughtUp = useDeferredValue(key) === key;
  const [floors, setFloors] = useState<{
    key: string;
    bySample: Partial<Record<ExampleRole, Floor>>;
  }>({ key, bySample: {} });
  const onFloor = (sample: ExampleRole, floor: Floor) =>
    setFloors((current) => ({
      key,
      bySample: {
        ...(current.key === key ? current.bySample : {}),
        [sample]: floor,
      },
    }));
  return {
    key,
    probing: caughtUp,
    measured: floors.key === key ? floors.bySample : {},
    onFloor,
  };
}

/** The widest floor across every sample: clips if one does, measuring until all are in. */
export function worstFloor(
  measured: Partial<Record<ExampleRole, Floor>>,
): Floor | "measuring" {
  const floors = EXAMPLE_ROLES.map((role) => measured[role]);
  if (floors.some((f) => f === "clips")) return "clips";
  return floors.every((f) => typeof f === "number")
    ? Math.max(...floors.map((f) => (typeof f === "number" ? f : 0)))
    : "measuring";
}
