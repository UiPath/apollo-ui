import type { SurfaceSpec } from "@/lib/composition";

export const pageHeaderSurface = {
  name: "page-header",
  provides: {
    orientation: "horizontal",
    width: { min: 0 },
    scroll: "occupant",
  },
} as const satisfies SurfaceSpec;
