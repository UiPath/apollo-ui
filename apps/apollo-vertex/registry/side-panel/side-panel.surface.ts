import type { SurfaceSpec } from "@/lib/composition";
import { LAYOUT_TOKENS, PADDED_INSET_PX } from "@/lib/composition";

/**
 * Appearance: beside-header panels use --side-panel-tint over the ambient
 * background. Below-header panels are transparent. The background follows
 * placement only; teams cannot set it.
 *
 * Width: the surface's own minimum is the --side-panel-width-min token.
 * How wide it is in a slot, and whether it resizes, is the slot's choice.
 */
export const sidePanelSurface = {
  name: "side-panel",
  width: { min: LAYOUT_TOKENS.sidePanelWidthMin },
  // Inner width at the minimum, less the padded inset on both sides.
  // fits() uses a slot's own width when it has one, and this otherwise.
  provides: {
    orientation: "vertical",
    width: { min: LAYOUT_TOKENS.sidePanelWidthMin - 2 * PADDED_INSET_PX },
    scroll: "either",
  },
} as const satisfies SurfaceSpec;
