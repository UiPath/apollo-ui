import type { SurfaceSpec } from "@/lib/composition";

export const contentAreaSurface = {
  name: "content-area",
  // 480px outer minimum, less the padded inset on both sides.
  provides: { width: { min: 432 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
