/**
 * Template layouts: where a template's slots sit, worked out from the
 * layout its spec declares (TemplateLayoutSpec) and a page's choices for
 * each slot. Previews draw a page map from it; a template's own layout
 * must agree with it, which tests check.
 */

import type { LayoutArea, LayoutTrack, TemplateSpec } from "./composition";

/** A page's choices for one slot. Anything left out is the default. */
export interface SlotChoice {
  /** False leaves an optional slot out. */
  present?: boolean;
  /** False closes a closable slot. */
  open?: boolean;
  /** One of the slot's placements; an unknown one is its own area. */
  placement?: string;
}

/** A page's choices, by slot name. */
export type LayoutChoices = Readonly<Record<string, SlotChoice>>;

/** Where one slot ends up: the tracks it spans, by name. */
export interface LayoutRegion extends LayoutArea {
  slot: string;
  open: boolean;
  /** Whether a placement put it there, not its own area. */
  placed: boolean;
}

/** A track, and whether any slot sits in it alone, so it takes up room. */
export interface ResolvedTrack extends LayoutTrack {
  used: boolean;
}

export interface ResolvedLayout {
  columns: readonly ResolvedTrack[];
  rows: readonly ResolvedTrack[];
  /** The slots that are there, in the spec's slot order. */
  regions: readonly LayoutRegion[];
}

interface Span {
  from: number;
  to: number;
}

const indexOf = (tracks: readonly LayoutTrack[], name: string) => {
  const index = tracks.findIndex((track) => track.name === name);
  if (index === -1) throw new Error(`No layout track named "${name}".`);
  return index;
};

const nameAt = (tracks: readonly LayoutTrack[], index: number) =>
  tracks[index]?.name ?? "";

const overlaps = (a: Span, b: Span) => a.from <= b.to && b.from <= a.to;

/**
 * Where each slot sits for the choices:
 *
 * - an optional slot left out isn't there; a closed one keeps its place;
 * - a placement moves a slot to its area for that placement;
 * - a placed slot takes priority, and a slot whose own area it overlaps
 *   gives up those columns at its edge, as a header does beside a panel
 *   that runs the page's full height;
 * - a track is used when some slot sits in it alone.
 *
 * It throws when a placement would cut a slot in two or leave it nothing.
 */
export function resolveLayout(
  spec: TemplateSpec,
  choices: LayoutChoices = {},
): ResolvedLayout {
  const layout = spec.layout;
  if (!layout) return { columns: [], rows: [], regions: [] };
  const { columns, rows, areas, options = {} } = layout;

  const placed = spec.slots.flatMap((slot) => {
    const area = areas[slot.name];
    if (!area) return [];
    const choice = choices[slot.name] ?? {};
    const own = options[slot.name] ?? {};
    if (own.optional && !slot.required && choice.present === false) return [];
    const moved = own.placements?.[choice.placement ?? ""];
    const at = moved ?? area;
    return [
      {
        slot: slot.name,
        open: !(own.closable && choice.open === false),
        placed: Boolean(moved),
        cols: {
          from: indexOf(columns, at.columns[0]),
          to: indexOf(columns, at.columns[1]),
        },
        rows: {
          from: indexOf(rows, at.rows[0]),
          to: indexOf(rows, at.rows[1]),
        },
      },
    ];
  });

  for (const region of placed) {
    if (region.placed) continue;
    for (const other of placed) {
      if (!other.placed || !overlaps(region.rows, other.rows)) continue;
      if (!overlaps(region.cols, other.cols)) continue;
      if (other.cols.from <= region.cols.from)
        region.cols.from = other.cols.to + 1;
      else if (other.cols.to >= region.cols.to)
        region.cols.to = other.cols.from - 1;
      else
        throw new Error(
          `The ${other.slot} slot's placement would cut ${region.slot} in two.`,
        );
      if (region.cols.from > region.cols.to)
        throw new Error(
          `The ${other.slot} slot's placement leaves ${region.slot} no room.`,
        );
    }
  }

  const alone = (span: (r: (typeof placed)[number]) => Span, index: number) =>
    placed.some((r) => span(r).from === index && span(r).to === index);
  return {
    columns: columns.map((track, i) => ({
      ...track,
      used: alone((r) => r.cols, i),
    })),
    rows: rows.map((track, i) => ({ ...track, used: alone((r) => r.rows, i) })),
    regions: placed.map((r) => ({
      slot: r.slot,
      open: r.open,
      placed: r.placed,
      columns: [nameAt(columns, r.cols.from), nameAt(columns, r.cols.to)],
      rows: [nameAt(rows, r.rows.from), nameAt(rows, r.rows.to)],
    })),
  };
}
