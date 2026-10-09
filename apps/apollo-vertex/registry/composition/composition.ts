/**
 * Composition specs for the three layout layers:
 *
 * - Templates declare named slots.
 * - Surfaces are reusable containers that fill slots.
 * - Occupants are the content placed inside surfaces.
 *
 * Every slot accepts a surface. Templates never hold occupants directly.
 * Templates own the geometry between slots: slot widths, dividers, the
 * resize handle, and open and close motion. Surfaces own everything inside
 * their box: padding, scrolling, fades, and background.
 * Each layer renders a matching data attribute: data-template, data-slot
 * (as "<template>-<slot>"), data-surface, data-occupant.
 *
 * Surface dimensions come from theme tokens in registry.json, generated
 * into layout-tokens.ts so CSS and these specs read the same values.
 */

import { LAYOUT_TOKENS } from "./layout-tokens";
import type {
  OccupantSizing,
  OccupantSpec,
  ScrollOwner,
  ScrollSupport,
  SlotCapacity,
  SlotSpec,
  SurfaceOrientation,
  SurfacePadding,
  SurfaceSpec,
} from "./specs";

export {
  LAYOUT_TOKENS,
  PANEL_TRANSITION_DURATION_MS,
  SIDE_PANEL_TINT_STRENGTH,
} from "./layout-tokens";

export type {
  LayoutArea,
  LayoutTrack,
  LocaleKey,
  OccupantRequirements,
  OccupantSizing,
  OccupantSpec,
  ScrollOwner,
  ScrollSupport,
  SlotCapacity,
  SlotLayoutOptions,
  SlotSpec,
  SlotWidth,
  SurfaceEnvelope,
  SurfaceOrientation,
  SurfacePadding,
  SurfaceSpec,
  SurfaceWidth,
  TemplateLayoutSpec,
  TemplateSpec,
} from "./specs";

/**
 * The padded inset in px: the --surface-inset token, which surfaces render
 * as their padding.
 */
export const PADDED_INSET_PX = LAYOUT_TOKENS.surfaceInset;

/** What a slot holds, with the default applied: one occupant, or a panel. */
export function slotHolds(slot: SlotSpec): SlotCapacity {
  return slot.holds ?? "one";
}

/** Whether a slot accepts the given surface. */
export function slotAccepts(slot: SlotSpec, surface: SurfaceSpec): boolean {
  return slot.surfaces.includes(surface.name);
}

/** How much wider than the occupant its surface is: both insets when padded, 0 when flush. */
export function occupantInset(occupant: OccupantSpec): number {
  return occupantPadding(occupant) === "padded" ? 2 * PADDED_INSET_PX : 0;
}

/** The padding a surface should apply for an occupant. */
export function occupantPadding(occupant: OccupantSpec): SurfacePadding {
  return occupant.requires.padding ?? "padded";
}

/** The orientations an occupant works in, with the default applied. */
export function occupantOrientations(
  occupant: OccupantSpec,
): readonly SurfaceOrientation[] {
  return occupant.orientations ?? ["vertical"];
}

/**
 * Who owns scrolling for an occupant in a surface. The occupant's
 * requirement decides; "either" goes to the surface when it can scroll.
 */
export function scrollOwner(
  surface: SurfaceSpec,
  occupant: OccupantSpec,
): ScrollOwner {
  const needs = occupant.requires.scroll;
  if (needs !== "either") return needs;
  return surface.provides.scroll === "occupant" ? "occupant" : "surface";
}

/**
 * The scroll rule: an occupant's scroll need is met when either side is
 * "either", or both name the same owner.
 */
export function scrollCompatible(
  support: ScrollSupport,
  needs: ScrollOwner | "either",
): boolean {
  return support === "either" || needs === "either" || support === needs;
}

/**
 * The inner width, in px, an occupant with the given padding gets in a
 * slot. A slot with its own width uses its default (what it renders at,
 * and always for a slot that isn't resizable), or its guaranteed minimum
 * when it has no default. Otherwise the surface's inner minimum is all that
 * is promised. A flush occupant gets the inset back, except when that
 * minimum is 0: no guarantee, nothing to add to.
 */
export function slotInnerWidth(
  slot: SlotSpec,
  surface: SurfaceSpec,
  padding: SurfacePadding,
): number {
  const inset = padding === "flush" ? 0 : 2 * PADDED_INSET_PX;
  if (slot.width) return (slot.width.default ?? slot.width.min) - inset;
  const min = surface.provides.width.min;
  return padding === "flush" && min > 0 ? min + 2 * PADDED_INSET_PX : min;
}

/**
 * What fits() needs of a panel: each tab's id and its occupants' specs. A
 * ResolvedPanel (see panel.ts) is one.
 */
export interface PanelOccupants {
  tabs: readonly {
    id: string;
    occupants: readonly { spec: OccupantSpec }[];
  }[];
}

/** The result of fits(): whether it fits, and every requirement that failed. */
export interface FitResult {
  fits: boolean;
  /** One plain sentence per failed requirement. Empty when it fits. */
  reasons: string[];
}

/**
 * Whether an occupant can go in a surface at all, whatever slot holds it:
 *
 * - the scroll owners agree (scrollCompatible);
 * - the occupant works in the surface's orientation;
 * - the occupant works in this surface, when it lists its surfaces.
 *
 * Width isn't checked: how wide a surface is depends on the slot that holds
 * it. Occupant checks use this to find every surface an occupant claims.
 */
export function fitsSurface(
  surface: SurfaceSpec,
  occupant: OccupantSpec,
): FitResult {
  const reasons: string[] = [];
  const { scroll: needsScroll } = occupant.requires;
  if (!scrollCompatible(surface.provides.scroll, needsScroll)) {
    reasons.push(
      `Needs ${needsScroll} scrolling; ${surface.name} supports ${surface.provides.scroll} only.`,
    );
  }
  const orientations = occupantOrientations(occupant);
  const { orientation } = surface.provides;
  if (!orientations.includes(orientation)) {
    reasons.push(
      `Works only in ${orientations.join(" or ")} surfaces; ${surface.name} is ${orientation}.`,
    );
  }
  if (occupant.surfaces && !occupant.surfaces.includes(surface.name)) {
    reasons.push(
      `Works only in ${occupant.surfaces.join(", ")}; this slot holds ${surface.name}.`,
    );
  }
  return { fits: reasons.length === 0, reasons };
}

/**
 * Whether an occupant fits a surface in a given slot. It checks every
 * requirement and lists each one that fails:
 *
 * - the slot accepts the surface;
 * - the slot's inner width, with the occupant's padding, covers its
 *   minWidth (padding has no check of its own: every surface takes both
 *   paddings, and padding changes the inner width);
 * - everything fitsSurface() checks: scroll, orientation, and the
 *   occupant's own list of surfaces.
 */
export function fits(
  slot: SlotSpec,
  surface: SurfaceSpec,
  occupant: OccupantSpec | PanelOccupants,
): FitResult {
  if ("tabs" in occupant) return fitsPanel(slot, surface, occupant);
  const reasons: string[] = [];
  const { minWidth } = occupant.requires;
  const padding = occupantPadding(occupant);

  if (!slotAccepts(slot, surface)) {
    reasons.push(`The ${slot.name} slot doesn't accept ${surface.name}.`);
  }
  const available = slotInnerWidth(slot, surface, padding);
  if (available < minWidth) {
    reasons.push(
      `Needs ${minWidth}px; the ${slot.name} slot gives ${available}px (${padding}).`,
    );
  }
  reasons.push(...fitsSurface(surface, occupant).reasons);
  return { fits: reasons.length === 0, reasons };
}

/** fits() for a panel: every occupant in every tab, reasons by occupant. */
function fitsPanel(
  slot: SlotSpec,
  surface: SurfaceSpec,
  panel: PanelOccupants,
): FitResult {
  const reasons = panel.tabs.flatMap((tab) =>
    tab.occupants.flatMap(({ spec }) =>
      fits(slot, surface, spec).reasons.map(
        (reason) => `${spec.name} (tab "${tab.id}"): ${reason}`,
      ),
    ),
  );
  return { fits: reasons.length === 0, reasons };
}

/** An occupant's sizing, with the default applied. */
export function occupantSizing(occupant: OccupantSpec): OccupantSizing {
  return occupant.sizing ?? "flow";
}
