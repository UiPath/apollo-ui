/**
 * Composition specs for the three layout layers:
 *
 * - Templates declare named slots.
 * - Surfaces are reusable containers that fill slots.
 * - Occupants are the content placed inside surfaces.
 *
 * Every slot accepts a surface. Templates never hold occupants directly.
 * Each layer renders a matching data attribute: data-template, data-slot
 * (as "<template>-<slot>"), data-surface, data-occupant.
 */

/** Which layer owns overflow scrolling inside a surface. */
export type ScrollOwner = "surface" | "occupant";

/** The space a surface gives whatever sits inside it. */
export interface SurfaceEnvelope {
  /** Inline size in px. Omit `max` when the surface is unbounded. */
  width: { min: number; max?: number };
  scroll: ScrollOwner;
}

export interface SurfaceSpec<TName extends string = string> {
  /** Rendered as data-surface. Lowercase, hyphenated. */
  name: TName;
  provides: SurfaceEnvelope;
}

/** What an occupant needs from the surface it sits in. */
export interface OccupantRequirements {
  minWidth: number;
  scroll: ScrollOwner | "either";
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

/**
 * Whether a surface guarantees what an occupant needs. Width is checked
 * against the surface's minimum, since that is all it promises.
 */
export function fits(surface: SurfaceSpec, occupant: OccupantSpec): boolean {
  const { width, scroll } = surface.provides;
  const { minWidth, scroll: needsScroll } = occupant.requires;
  const widthFits = width.min >= minWidth;
  const scrollFits = needsScroll === "either" || needsScroll === scroll;
  return widthFits && scrollFits;
}
