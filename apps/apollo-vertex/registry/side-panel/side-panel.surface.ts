import type { SurfaceSpec } from "@/lib/composition";

export const sidePanelSurface = {
  name: "side-panel",
  provides: { width: { min: 280, max: 280 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
