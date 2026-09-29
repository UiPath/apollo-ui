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

import type { LucideIcon } from "lucide-react";
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

/** The space a surface gives whatever sits inside it. */
export interface SurfaceEnvelope {
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
  /**
   * The narrowest inner width, in px, where the occupant still works. An
   * occupant must render without clipping or overflowing at any width from
   * its minWidth up.
   */
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
  /** Optional icon for pickers and switchers, a lucide icon component. */
  icon?: LucideIcon;
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
 * and always for a slot that isn't resizable). Otherwise the surface's
 * inner minimum is all that is promised. A flush occupant gets the inset
 * back, except when that minimum is 0: no guarantee, nothing to add to.
 */
export function slotInnerWidth(
  slot: SlotSpec,
  surface: SurfaceSpec,
  padding: SurfacePadding,
): number {
  const inset = padding === "flush" ? 0 : 2 * PADDED_INSET_PX;
  if (slot.width) return slot.width.default - inset;
  const min = surface.provides.width.min;
  return padding === "flush" && min > 0 ? min + 2 * PADDED_INSET_PX : min;
}

/** The result of fits(): whether it fits, and every requirement that failed. */
export interface FitResult {
  fits: boolean;
  /** One plain sentence per failed requirement. Empty when it fits. */
  reasons: string[];
}

/**
 * Whether an occupant fits a surface in a given slot. It checks every
 * requirement and lists each one that fails:
 *
 * - the slot accepts the surface;
 * - the slot's inner width, with the occupant's padding, covers its
 *   minWidth (padding has no check of its own: every surface takes both
 *   paddings, and padding changes the inner width);
 * - the scroll owners agree (scrollCompatible).
 */
export function fits(
  slot: SlotSpec,
  surface: SurfaceSpec,
  occupant: OccupantSpec,
): FitResult {
  const reasons: string[] = [];
  const { minWidth, scroll: needsScroll } = occupant.requires;
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
  if (!scrollCompatible(surface.provides.scroll, needsScroll)) {
    reasons.push(
      `Needs ${needsScroll} scrolling; ${surface.name} supports ${surface.provides.scroll} only.`,
    );
  }
  return { fits: reasons.length === 0, reasons };
}
