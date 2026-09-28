import type { SurfaceSpec } from "@/lib/composition";

export const sidePanelSurface = {
  name: "side-panel",
  // 280px outer, less the padded inset on both sides.
  provides: { width: { min: 232, max: 232 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
