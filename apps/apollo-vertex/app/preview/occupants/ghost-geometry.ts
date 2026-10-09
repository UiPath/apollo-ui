import type { TemplateSpec } from "@/lib/composition";
import {
  type LayoutChoices,
  type LayoutRegion,
  resolveLayout,
} from "@/lib/layout";
import type { Box } from "./use-slot-boxes";

/*
 * Where a slot the page left out would sit, for its ghost in Edit mode:
 * its area in the template's layout as if it were included, by each
 * track's relative size, over the template's box, with each edge it
 * shares with a slot that's there lined up with that slot's real edge. The other slots have
 * taken its room, so the ghost lies over them.
 */

/** A slot left out by the choices: one its layout options let a page leave out. */
export const leftOutSlots = (spec: TemplateSpec, choices: LayoutChoices) =>
  spec.slots
    .map((slot) => slot.name)
    .filter((slot) => choices[slot]?.present === false);

/** Where a region starts and spans along one axis, over the tracks some slot uses. */
const span = (
  tracks: readonly { name: string; size: number; used: boolean }[],
  [first, last]: readonly [string, string],
  start: number,
  length: number,
) => {
  const used = tracks.filter((track) => track.used);
  const total = used.reduce((sum, track) => sum + track.size, 0) || 1;
  const from = used.findIndex((track) => track.name === first);
  const to = used.findIndex((track) => track.name === last);
  if (from < 0 || to < from) return null;
  const before = used
    .slice(0, from)
    .reduce((sum, track) => sum + track.size, 0);
  const across = used
    .slice(from, to + 1)
    .reduce((sum, track) => sum + track.size, 0);
  return {
    at: start + (length * before) / total,
    size: (length * across) / total,
  };
};

/** A left-out slot's box over the template's, or null when it has no area. */
export function ghostBox(
  spec: TemplateSpec,
  choices: LayoutChoices,
  slot: string,
  template: Box,
  /** The slots that are there, by their real boxes, to line its edges up with. */
  present: Readonly<Record<string, Box>> = {},
): Box | null {
  const included = resolveLayout(spec, {
    ...choices,
    [slot]: { ...choices[slot], present: true },
  });
  const region = included.regions.find((r) => r.slot === slot);
  if (!region) return null;
  const x = span(included.columns, region.columns, template.x, template.width);
  const y = span(included.rows, region.rows, template.y, template.height);
  if (!x || !y) return null;
  // Track sizes are relative: where a slot that's there shares an edge
  // track, take its real edge instead.
  const there = resolveLayout(spec, choices).regions.flatMap((r) => {
    const box = present[r.slot];
    return box ? [{ region: r, box }] : [];
  });
  const edge = (
    match: (r: LayoutRegion) => boolean,
    real: (box: Box) => number,
    guess: number,
  ) => {
    const found = there.find(({ region: r }) => match(r));
    return found ? real(found.box) : guess;
  };
  const left = edge(
    (r) => r.columns[0] === region.columns[0],
    (b) => b.x,
    x.at,
  );
  const right = edge(
    (r) => r.columns[1] === region.columns[1],
    (b) => b.x + b.width,
    x.at + x.size,
  );
  const top = edge(
    (r) => r.rows[0] === region.rows[0],
    (b) => b.y,
    y.at,
  );
  const bottom = edge(
    (r) => r.rows[1] === region.rows[1],
    (b) => b.y + b.height,
    y.at + y.size,
  );
  return right > left && bottom > top
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : { x: x.at, y: y.at, width: x.size, height: y.size };
}
