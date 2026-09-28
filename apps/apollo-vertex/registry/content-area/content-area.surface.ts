import type { SurfaceSpec } from "@/lib/composition";
import { LAYOUT_TOKENS, PADDED_INSET_PX } from "@/lib/composition";

export const contentAreaSurface = {
  name: "content-area",
  // The --content-area-width-min token.
  width: { min: LAYOUT_TOKENS.contentAreaWidthMin },
  // Inner width at the minimum, less the padded inset on both sides.
  provides: {
    width: { min: LAYOUT_TOKENS.contentAreaWidthMin - 2 * PADDED_INSET_PX },
    scroll: "either",
  },
} as const satisfies SurfaceSpec;
