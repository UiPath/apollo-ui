import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type {
  InsertionSlot,
  SequenceConnector,
  SequenceProjection,
  SequenceRow,
  SequenceStep,
  SlotRef,
} from './sequential.types';

/** Options for {@link projectTree}. */
export interface ProjectTreeOptions {
  collapsedStepIds?: ReadonlySet<string>;
}

/** The projection of a step tree, and one canonical node per step for the bars to draw. */
export interface TreeProjection {
  projection: SequenceProjection;
  nodes: Node[];
}

const EMPTY: ReadonlySet<string> = new Set();

/** Row id of an empty slot's "Add step" placeholder. */
export const treeLanePlaceholderId = (ownerId: string, slot: string): string =>
  `__sequential-lane__${ownerId}::${slot}`;

/** Row id of the quiet add point after a slot's last step. */
export const treeAppendPlaceholderId = (lastStepId: string): string =>
  `__sequential-lane__${lastStepId}::__tail__`;

function slotOf(ref: SlotRef, id: string): InsertionSlot {
  return { id, ref };
}

/**
 * Projects a tree of steps (each with ordered, named slots of steps) into the same rows,
 * connectors and slots the graph projection makes, so the same layout, bars and connectors draw
 * it. A tree is structured by construction: no merge analysis, no gotos, nothing read-only.
 *
 * The root is the level the host shows. A root with one slot (a sequence) lists that slot's steps
 * at depth 0; any other root is itself the one row at depth 0, with its slots as lanes. Every
 * insertion slot carries a {@link SlotRef}: the host's own address for "a step goes here".
 */
export function projectTree(root: SequenceStep, options?: ProjectTreeOptions): TreeProjection {
  const collapsed = options?.collapsedStepIds ?? EMPTY;
  const rows: SequenceRow[] = [];
  const connectors: SequenceConnector[] = [];
  const slots: InsertionSlot[] = [];
  const nodes: Node[] = [];
  const seen = new Set<string>();
  let counter = 0;

  const addSlot = (slot: InsertionSlot): InsertionSlot => {
    slots.push(slot);
    return slot;
  };

  const emitStep = (
    step: SequenceStep,
    depth: number,
    parentRowId: string | undefined,
    branch: SequenceRow['branch']
  ): void => {
    if (seen.has(step.id)) {
      throw new Error(`projectTree: the step id '${step.id}' appears twice.`);
    }
    seen.add(step.id);
    const hasSlots = (step.slots?.length ?? 0) > 0;
    rows.push({
      nodeId: step.id,
      stepNumber: ++counter,
      depth,
      parentRowId,
      ...(branch ? { branch } : {}),
      collapsible: hasSlots,
      collapsed: hasSlots && collapsed.has(step.id),
      visible: true,
      isLeaf: !hasSlots || undefined,
    });
    nodes.push({
      id: step.id,
      type: step.type,
      position: { x: 0, y: 0 },
      // The bar reads its label and summary from `display`, as BaseNode's own rename writes them.
      data: {
        ...(step.data ?? {}),
        display: {
          ...((step.data?.display as Record<string, unknown> | undefined) ?? {}),
          label: step.label,
          ...(step.subLabel !== undefined ? { subLabel: step.subLabel } : {}),
          ...(step.icon !== undefined ? { icon: step.icon } : {}),
        },
      },
      ...(step.locked ? { draggable: false, deletable: false } : {}),
    });

    for (const slot of step.slots ?? []) {
      const laneBranch = { sourceNodeId: step.id, handleId: slot.name, label: slot.label ?? '' };
      const [first] = slot.steps;
      if (!first) {
        const placeholderId = treeLanePlaceholderId(step.id, slot.name);
        rows.push({
          nodeId: placeholderId,
          depth: depth + 1,
          parentRowId: step.id,
          branch: laneBranch,
          collapsible: false,
          collapsed: false,
          visible: true,
          lanePlaceholder: addSlot(
            slotOf(
              { parentId: step.id, slot: slot.name, after: null },
              `slot:lane:${step.id}:${slot.name}`
            )
          ),
          placeholderKind: 'lane',
        });
        connectors.push({
          id: `conn:lane:${step.id}:${slot.name}`,
          kind: 'branch-entry',
          sourceRowId: step.id,
          targetRowId: placeholderId,
          label: slot.label,
        });
        continue;
      }

      connectors.push({
        id: `conn:entry:${step.id}:${slot.name}`,
        kind: 'branch-entry',
        sourceRowId: step.id,
        targetRowId: first.id,
        label: slot.label,
        slot: addSlot(
          slotOf(
            { parentId: step.id, slot: slot.name, after: null },
            `slot:head:${step.id}:${slot.name}`
          )
        ),
      });
      emitChain(slot.steps, depth + 1, step.id, slot.name, step.id, laneBranch);
    }
  };

  /** Steps of one slot: chained in order, then the quiet add point after the last one. */
  const emitChain = (
    steps: readonly SequenceStep[],
    depth: number,
    parentRowId: string | undefined,
    slotName: string | null,
    ownerId: string,
    firstBranch: SequenceRow['branch']
  ): void => {
    steps.forEach((step, index) => {
      emitStep(step, depth, parentRowId, index === 0 ? firstBranch : undefined);
      const next = steps[index + 1];
      if (!next) return;
      connectors.push({
        id: `conn:step:${step.id}:${next.id}`,
        // After a step that holds others, the next one joins back below its lanes.
        kind: (step.slots?.length ?? 0) > 0 ? 'merge-back' : 'step',
        sourceRowId: step.id,
        targetRowId: next.id,
        slot: addSlot(
          slotOf({ parentId: ownerId, slot: slotName, after: step.id }, `slot:after:${step.id}`)
        ),
      });
    });

    // The top level ends at the canvas's own terminal placeholder (see `tailSlot`).
    if (parentRowId === undefined) return;
    const last = steps[steps.length - 1]!;
    const appendId = treeAppendPlaceholderId(last.id);
    rows.push({
      nodeId: appendId,
      depth,
      parentRowId,
      collapsible: false,
      collapsed: false,
      visible: true,
      lanePlaceholder: addSlot(
        slotOf({ parentId: ownerId, slot: slotName, after: last.id }, `slot:leaf:${last.id}`)
      ),
      placeholderKind: 'append',
    });
    connectors.push({
      id: `conn:leaf:${last.id}`,
      kind: 'step',
      sourceRowId: last.id,
      targetRowId: appendId,
    });
  };

  // A root that is a plain list (one slot) shows that list; any other root is its own one row.
  const rootSlots = root.slots ?? [];
  const listSlot = rootSlots.length === 1 ? rootSlots[0]! : undefined;
  const topSteps = listSlot ? listSlot.steps : [root];
  const topRef = (after: string | null): SlotRef =>
    listSlot
      ? { parentId: root.id, slot: listSlot.name, after }
      : { parentId: root.id, slot: null, after };
  emitChain(topSteps, 0, undefined, listSlot?.name ?? null, root.id, undefined);

  // Rows are in pre-order, so a parent's visibility is always resolved first.
  const rowsById = new Map(rows.map((row) => [row.nodeId, row]));
  for (const row of rows) {
    const parent = row.parentRowId ? rowsById.get(row.parentRowId) : undefined;
    row.visible = parent ? parent.visible && !parent.collapsed : true;
  }

  const firstTop = topSteps[0];
  const lastTop = topSteps[topSteps.length - 1];
  return {
    projection: {
      rows,
      connectors,
      slots,
      ...(listSlot && firstTop
        ? {
            headSlot: {
              ...slotOf(topRef(null), `slot:head:${firstTop.id}`),
              target: { nodeId: firstTop.id },
            },
          }
        : {}),
      ...(listSlot
        ? { tailSlot: slotOf(topRef(lastTop?.id ?? null), `slot:tail:${root.id}`) }
        : {}),
    },
    nodes,
  };
}
