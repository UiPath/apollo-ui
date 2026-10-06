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

import type { LucideIcon } from "lucide-react";
import type { ParseKeys } from "react-i18next";
import { LAYOUT_TOKENS } from "./layout-tokens";

export {
  LAYOUT_TOKENS,
  PANEL_TRANSITION_DURATION_MS,
  SIDE_PANEL_TINT_STRENGTH,
} from "./layout-tokens";

/**
 * Which layer owns overflow scrolling inside a surface. The owner is the
 * scroll container and draws the scroll fades; the other layer does
 * neither. Each surface scrolls on its own.
 */
export type ScrollOwner = "surface" | "occupant";

/**
 * Who a surface lets own scrolling. "either" means it can be the scroll
 * container or hand scrolling to its occupant; "occupant" means it never
 * scrolls (e.g. the page header).
 */
export type ScrollSupport = ScrollOwner | "either";

/**
 * How a surface insets its occupant. Surfaces own padding; occupants never
 * add outer padding. "padded" is PADDED_INSET_PX on every side, "flush" is 0.
 */
export type SurfacePadding = "padded" | "flush";

/**
 * The padded inset in px: the --surface-inset token, which surfaces render
 * as their padding.
 */
export const PADDED_INSET_PX = LAYOUT_TOKENS.surfaceInset;

/**
 * The shape of the space a surface gives its occupant. "horizontal" is a
 * wide, short band that doesn't grow downward (the page header).
 * "vertical" is a column that grows downward and can scroll (side panels,
 * main). Occupants adapt to this shape, never to the surface's name.
 */
export type SurfaceOrientation = "horizontal" | "vertical";

/** The space a surface gives whatever sits inside it. */
export interface SurfaceEnvelope {
  orientation: SurfaceOrientation;
  /**
   * Inline size in px given to a padded occupant, after the inset. A flush
   * occupant gets PADDED_INSET_PX more on each side. Omit `max` when the
   * surface is unbounded.
   */
  width: { min: number; max?: number };
  scroll: ScrollSupport;
}

/**
 * A surface's own outer minimum width in px, including its padding: the
 * narrowest it supports anywhere. Compare `provides.width`, the inner width
 * an occupant gets. How wide it is in a given slot is the slot's choice.
 */
export interface SurfaceWidth {
  min: number;
}

/**
 * A slot's outer width range in px.
 *
 * - `min` is the width the slot always guarantees.
 * - `default` is what a sized slot renders at (always, when not
 *   resizable). Omit it for a slot that takes whatever space the layout
 *   gives it, like a header that spans the page.
 * - `max: "main"` means never wider than the template's main slot. Omit it
 *   when there is no maximum.
 *
 * Must stay within the surface's own minimum.
 */
export interface SlotWidth {
  min: number;
  default?: number;
  max?: number | "main";
}

export interface SurfaceSpec<TName extends string = string> {
  /** Rendered as data-surface. Lowercase, hyphenated. */
  name: TName;
  /** The surface's own minimum outer width. */
  width?: SurfaceWidth;
  provides: SurfaceEnvelope;
}

/** What an occupant needs from the surface it sits in. */
export interface OccupantRequirements {
  /**
   * The narrowest inner width, in px, where the occupant still works: it
   * must render without clipping at any width from here up. By default it
   * follows the width token of the narrowest surface it belongs in; a
   * horizontal occupant's is its measured floor. A raised minimum has its
   * reason in a comment above `requires`.
   */
  minWidth: number;
  scroll: ScrollOwner | "either";
  /** Defaults to "padded". */
  padding?: SurfacePadding;
}

/**
 * A locale key: a key in locales/en.json, translated where it's shown, and
 * checked against en.json by the compiler. Titles and labels in specs are
 * always keys, never English.
 */
export type LocaleKey = ParseKeys;

/**
 * How an occupant takes up a panel's height. "flow" (the default) is as
 * tall as its content, so it can share a tab with others and the tab
 * scrolls. "fill" takes the whole tab, like a document viewer: it's alone
 * in its tab and handles its own scrolling.
 */
export type OccupantSizing = "flow" | "fill";

export interface OccupantSpec<TName extends string = string> {
  /** Rendered as data-occupant. Lowercase, hyphenated. */
  name: TName;
  /** Human-readable name shown in tooling and docs. */
  label: string;
  /** Optional icon for pickers and switchers, a lucide icon component. */
  icon?: LucideIcon;
  /**
   * The surfaces the occupant belongs in, by name: only when it's some, not
   * all, of the surfaces of its orientations. Leave it out otherwise.
   */
  surfaces?: readonly string[];
  /** The surface orientations the occupant works in. Defaults to ["vertical"]. */
  orientations?: readonly SurfaceOrientation[];
  /**
   * Its display title, as a locale key: a panel's stack heading or tab
   * label when the panel gives none. Never shown as the slug.
   */
  titleKey: LocaleKey;
  /** Defaults to "flow". */
  sizing?: OccupantSizing;
  requires: OccupantRequirements;
}

export interface SlotSpec<TName extends string = string> {
  /** Rendered as data-slot="<template>-<name>". Lowercase, hyphenated. */
  name: TName;
  required: boolean;
  /** The slot's width range, for slots whose surface the template sizes. */
  width?: SlotWidth;
  /**
   * Whether the user can resize the surface in this slot. The template owns
   * the handle, within the slot's `width` range.
   */
  resizable?: boolean;
  /** Names of the surfaces this slot accepts. */
  surfaces: readonly string[];
}

/** A template's grid track, by name, with its relative size on a page map. */
export interface LayoutTrack {
  name: string;
  size: number;
}

/** Tracks a slot spans, by name: [first, last], on each axis. */
export interface LayoutArea {
  columns: readonly [string, string];
  rows: readonly [string, string];
}

/** What a page can choose for a slot in its template's layout. */
export interface SlotLayoutOptions {
  /** It can be left out. A required slot never is. */
  optional?: boolean;
  /** It can be closed; a closed slot keeps its place, at no width. */
  closable?: boolean;
  /** Other areas it can take, by placement name; its own area is the default. */
  placements?: Readonly<Record<string, LayoutArea>>;
  /** What its own area is called as a placement, when it has others. */
  defaultPlacement?: string;
}

/**
 * Where a template's slots sit, as data: the grid's tracks, each slot's
 * area, and the choices a page has. resolveLayout() reads it.
 */
export interface TemplateLayoutSpec {
  columns: readonly LayoutTrack[];
  rows: readonly LayoutTrack[];
  areas: Readonly<Record<string, LayoutArea>>;
  options?: Readonly<Record<string, SlotLayoutOptions>>;
  /** Its own words as locale keys, by placement name and reason code. */
  copy?: {
    placements?: Readonly<Record<string, LocaleKey>>;
    reasons?: Readonly<Record<string, LocaleKey>>;
  };
}

export interface TemplateSpec<TName extends string = string> {
  /** Rendered as data-template. Lowercase, hyphenated. */
  name: TName;
  slots: readonly SlotSpec[];
  layout: TemplateLayoutSpec;
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
