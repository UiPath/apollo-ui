import type { SurfaceSpec } from "@/lib/composition";

export const sidePanelSurface = {
  name: "side-panel",
  // Outer width. A fixed panel uses `min`; a resizable one starts at
  // `default` and is never wider than main.
  width: { min: 280, default: 360, max: "main" },
  // Inner width at the minimum: 280px less the padded inset on both sides.
  // fits() checks this.
  provides: { width: { min: 232 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
