import type { InsertionSlot, SequenceStep, SlotRef } from './sequential.types';

/** The four moves of a step of a tree; a direction the step cannot go is `undefined`. */
export interface TreeMoveOptions {
  up: InsertionSlot | undefined;
  down: InsertionSlot | undefined;
  indent: InsertionSlot | undefined;
  outdent: InsertionSlot | undefined;
}

interface Place {
  step: SequenceStep;
  parent: SequenceStep | undefined;
  slot: string | null;
  siblings: readonly SequenceStep[];
  index: number;
}

const NONE: TreeMoveOptions = {
  up: undefined,
  down: undefined,
  indent: undefined,
  outdent: undefined,
};

function placesOf(root: SequenceStep): Map<string, Place> {
  const places = new Map<string, Place>();
  const visit = (step: SequenceStep): void => {
    for (const slot of step.slots ?? []) {
      slot.steps.forEach((child, index) => {
        places.set(child.id, {
          step: child,
          parent: step,
          slot: slot.name,
          siblings: slot.steps,
          index,
        });
        visit(child);
      });
    }
  };
  places.set(root.id, { step: root, parent: undefined, slot: null, siblings: [root], index: 0 });
  visit(root);
  return places;
}

const at = (id: string, ref: SlotRef): InsertionSlot => ({ id, ref });

/**
 * Where a step of a tree can move, as the sequential view offers it (Alt+Arrow, the step menu):
 * up or down past its neighbour in its slot; indented into the end of the last slot of the step
 * above it, when that step holds others; outdented to just after the step that holds it. The root
 * and a locked step do not move, and nothing moves out of the root's own list.
 */
export function treeMoveOptions(root: SequenceStep, nodeId: string): TreeMoveOptions {
  const places = placesOf(root);
  const place = places.get(nodeId);
  if (!place?.parent || place.step.locked) return NONE;
  const { parent, slot, siblings, index } = place;

  const prev = siblings[index - 1];
  const next = siblings[index + 1];
  const intoSlot = prev?.slots?.[prev.slots.length - 1];
  const owner = places.get(parent.id);

  return {
    up: prev
      ? at(`move:up:${nodeId}`, {
          parentId: parent.id,
          slot,
          after: siblings[index - 2]?.id ?? null,
        })
      : undefined,
    down: next
      ? at(`move:down:${nodeId}`, { parentId: parent.id, slot, after: next.id })
      : undefined,
    indent:
      prev && intoSlot
        ? at(`move:indent:${nodeId}`, {
            parentId: prev.id,
            slot: intoSlot.name,
            after: intoSlot.steps[intoSlot.steps.length - 1]?.id ?? null,
          })
        : undefined,
    outdent: owner?.parent
      ? at(`move:outdent:${nodeId}`, {
          parentId: owner.parent.id,
          slot: owner.slot,
          after: parent.id,
        })
      : undefined,
  };
}
