/**
 * The composition specs' types: what templates, slots, surfaces, and
 * occupants declare. Pure data shapes; the rules that read them are in
 * composition.ts, which re-exports all of these.
 */

import type { LucideIcon } from "lucide-react";
import type { ParseKeys } from "react-i18next";

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
  /** What it holds. Defaults to "one". */
  holds?: SlotCapacity;
}

/**
 * How much a slot holds: "one" occupant, or a "panel" of tabs and stacks
 * of occupants (a PanelSpec, see panel.ts).
 */
export type SlotCapacity = "one" | "panel";

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
