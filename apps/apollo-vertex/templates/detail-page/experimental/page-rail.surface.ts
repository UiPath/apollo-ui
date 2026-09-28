import type { SurfaceSpec } from "@/lib/composition";

/**
 * Experimental: option C ("Rail") for start panel controls. Lives outside
 * the registry while it is compared with option B ("In panel"). Moves to
 * the registry if kept, deleted if not.
 */
export const pageRailSurface = {
  name: "page-rail",
  experimental: true,
  // Holds controls, not an occupant, so there is no padded inset.
  provides: { width: { min: 44, max: 44 }, scroll: "surface" },
} as const satisfies SurfaceSpec;
