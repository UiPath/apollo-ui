import type { SurfaceSpec } from "@/lib/composition";

export const contentAreaSurface = {
  name: "content-area",
  // Minimum width is still to be decided. It depends on the panel
  // configurations for narrow screens. Until then it guarantees nothing.
  provides: { width: { min: 0 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
