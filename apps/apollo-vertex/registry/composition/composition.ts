/**
 * Composition specs for the three layout layers:
 *
 * - Templates declare named slots.
 * - Surfaces are reusable containers that fill slots.
 * - Occupants are the content placed inside surfaces.
 *
 * Every slot accepts a surface. Templates never hold occupants directly.
 * Templates draw the lines between slots. Surfaces own everything inside.
 * Each layer renders a matching data attribute: data-template, data-slot
 * (as "<template>-<slot>"), data-surface, data-occupant.
 *
 * Surface dimensions come from theme tokens in registry.json, generated
 * into layout-tokens.ts so CSS and these specs read the same values.
 */

import { LAYOUT_TOKENS } from "./layout-tokens";

export { LAYOUT_TOKENS, SIDE_PANEL_TINT_STRENGTH } from "./layout-tokens";

/** Which layer owns overflow scrolling inside a surface. */
export type ScrollOwner = "surface" | "occupant";

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

/** The space a surface gives whatever sits inside it. */
export interface SurfaceEnvelope {
  /**
   * Inline size in px given to a padded occupant, after the inset. A flush
   * occupant gets PADDED_INSET_PX more on each side. Omit `max` when the
   * surface is unbounded.
   */
  width: { min: number; max?: number };
  scroll: ScrollOwner;
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
 * A slot's outer width range in px. `default` is what the slot renders at
 * (always, when not resizable); `max: "main"` means never wider than the
 * template's main slot. Must stay within the surface's own minimum.
 */
export interface SlotWidth {
  min: number;
  default: number;
  max: number | "main";
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
  minWidth: number;
  scroll: ScrollOwner | "either";
  /** Defaults to "padded". */
  padding?: SurfacePadding;
}

export interface OccupantSpec<TName extends string = string> {
  /** Rendered as data-occupant. Lowercase, hyphenated. */
  name: TName;
  /** Human-readable name shown in tooling and docs. */
  label: string;
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

export interface TemplateSpec<TName extends string = string> {
  /** Rendered as data-template. Lowercase, hyphenated. */
  name: TName;
  slots: readonly SlotSpec[];
}

/** The data-slot value for a template slot, e.g. "detail-page-main". */
export function slotAttribute(template: TemplateSpec, slot: SlotSpec): string {
  return `${template.name}-${slot.name}`;
}

/** Whether a slot accepts the given surface. */
export function slotAccepts(slot: SlotSpec, surface: SurfaceSpec): boolean {
  return slot.surfaces.includes(surface.name);
}

/** The padding a surface should apply for an occupant. */
export function occupantPadding(occupant: OccupantSpec): SurfacePadding {
  return occupant.requires.padding ?? "padded";
}

/**
 * Whether a surface guarantees what an occupant needs. Width is checked
 * against the surface's minimum inner width, since that is all it promises.
 * A flush occupant also gets the inset back, except when the minimum is 0:
 * that means no guarantee, so there is nothing to add to.
 */
export function fits(surface: SurfaceSpec, occupant: OccupantSpec): boolean {
  const { width, scroll } = surface.provides;
  const { minWidth, scroll: needsScroll } = occupant.requires;
  const isFlush = occupantPadding(occupant) === "flush";
  const available =
    isFlush && width.min > 0 ? width.min + 2 * PADDED_INSET_PX : width.min;
  const widthFits = available >= minWidth;
  const scrollFits = needsScroll === "either" || needsScroll === scroll;
  return widthFits && scrollFits;
}
