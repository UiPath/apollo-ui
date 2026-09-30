import type { SurfaceSpec } from "@/lib/composition";
import { LAYOUT_TOKENS, PADDED_INSET_PX } from "@/lib/composition";

export const contentAreaSurface = {
  name: "content-area",
  width: { min: LAYOUT_TOKENS.contentAreaWidthMin },
  provides: {
    orientation: "vertical",
    width: { min: LAYOUT_TOKENS.contentAreaWidthMin - 2 * PADDED_INSET_PX },
    scroll: "either",
  },
} as const satisfies SurfaceSpec;
