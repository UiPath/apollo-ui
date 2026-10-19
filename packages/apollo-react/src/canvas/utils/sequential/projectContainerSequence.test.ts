import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID } from '../../constants';
import {
  SEQUENCED_CONTAINER_NODE_IDS as ids,
  makeRuntimeContainerFixture,
  makeSequencedContainerFixture,
  RUNTIME_CONTAINER_NODE_IDS as rc,
} from './fixtures';
import { resolveSequenceMetrics } from './layoutSequence';
import { canSequenceContainer, projectContainerSequence } from './projectContainerSequence';

const decisionBranches = (node: Node) =>
  node.id === ids.decision
    ? [
        { id: 'true', label: 'Then' },
        { id: 'false', label: 'Else' },
      ]
    : [];

function project(overrides: Parameters<typeof projectContainerSequence>[3] = {}) {
  const { nodes, edges } = makeSequencedContainerFixture();
  const result = projectContainerSequence(nodes, edges, ids.container, {
    getBranchHandles: decisionBranches,
    ...overrides,
  });
  if (!result) throw new Error('expected a container sequence');
  return result;
}

const rowIds = (rows: { nodeId: string }[]) => rows.map((row) => row.nodeId);

describe('projectContainerSequence', () => {
  it('projects only the direct children, with no start row and the first child as root', () => {
    const { projection, childIds } = project();

    expect(rowIds(projection.rows)).toEqual([
      ids.validate,
      ids.decision,
      ids.reserve,
      ids.transform,
    ]);
    expect(projection.rows[0]?.depth).toBe(0);
    expect(projection.rows[0]?.stepNumber).toBe(1);
    expect([...childIds].sort()).toEqual(
      [ids.validate, ids.decision, ids.reserve, ids.transform].sort()
    );
    // The entry and exit edges touch the container itself and fall outside the scope.
    const referencedIds = projection.connectors.flatMap((c) => [c.sourceRowId, c.targetRowId]);
    expect(referencedIds).not.toContain(ids.container);
    expect(referencedIds).not.toContain(ids.http);
    expect(referencedIds).not.toContain(ids.notify);
  });

  it('stamps every slot with the container id so inserts parent correctly', () => {
    const { projection } = project();

    expect(projection.slots.length).toBeGreaterThan(0);
    for (const slot of projection.slots) {
      expect(slot.containerId).toBe(ids.container);
    }
    // Spine, branch-entry and merge-back connectors all carry stamped slots.
    const branchEntries = projection.connectors.filter((c) => c.kind === 'branch-entry');
    expect(branchEntries.length).toBe(2);
    expect(branchEntries.every((c) => c.slot?.containerId === ids.container)).toBe(true);
    const mergeBack = projection.connectors.find((c) => c.kind === 'merge-back');
    expect(mergeBack?.slot?.containerId).toBe(ids.container);
  });

  it('stamps declared empty-lane placeholder slots too', () => {
    const container: Node = {
      id: 'c',
      type: 'uipath.control-flow.foreach',
      position: { x: 0, y: 0 },
      data: {},
    };
    const ifNode: Node = {
      id: 'if',
      type: 'if',
      parentId: 'c',
      position: { x: 0, y: 0 },
      data: {},
    };
    const result = projectContainerSequence([container, ifNode], [], 'c', {
      getBranchHandles: (node) =>
        node.id === 'if'
          ? [
              { id: 'true', label: 'Then' },
              { id: 'false', label: 'Else' },
            ]
          : [],
    });

    const laneRows = result?.projection.rows.filter((row) => row.lanePlaceholder) ?? [];
    expect(laneRows.map((row) => row.lanePlaceholder?.id)).toEqual([
      'slot:lane:if:true',
      'slot:lane:if:false',
    ]);
    expect(laneRows.every((row) => row.lanePlaceholder?.containerId === 'c')).toBe(true);
    expect(result?.projection.slots.every((slot) => slot.containerId === 'c')).toBe(true);
  });

  it('lays rows out in container-local space with lanes indented by the metric', () => {
    const { projection, layout } = project();
    const metrics = resolveSequenceMetrics();
    const positions = projection.rows.map((row) => layout.positions.get(row.nodeId)!);

    expect(layout.positions.get(ids.validate)).toEqual({ x: 0, y: 0 });
    expect(Math.min(...positions.map((p) => p.x))).toBe(0);
    expect(layout.positions.get(ids.reserve)?.x).toBe(metrics.indent);
    expect(layout.positions.get(ids.transform)?.x).toBe(0);
    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(layout.bounds.x);
      expect(position.y).toBeGreaterThanOrEqual(layout.bounds.y);
      expect(position.x + metrics.barWidth).toBeLessThanOrEqual(
        layout.bounds.x + layout.bounds.width
      );
      expect(position.y + metrics.barHeight).toBeLessThanOrEqual(
        layout.bounds.y + layout.bounds.height
      );
    }
  });

  it('splices a preview row at the insert slot and shifts the rows below by one pitch', () => {
    const base = project();
    const slot = base.projection.slots.find((s) => s.graphEdgeId === 'sc-validate-decision');
    expect(slot).toBeDefined();

    const withPreview = project({ insertSlot: slot });
    const metrics = resolveSequenceMetrics();

    expect(rowIds(withPreview.projection.rows)).toEqual([
      ids.validate,
      PREVIEW_NODE_ID,
      ids.decision,
      ids.reserve,
      ids.transform,
    ]);
    expect(withPreview.layout.positions.get(PREVIEW_NODE_ID)).toBeDefined();
    expect(withPreview.layout.positions.get(ids.decision)?.y).toBe(
      base.layout.positions.get(ids.decision)!.y + metrics.pitch
    );
  });

  describe('blockers', () => {
    it('returns undefined for a missing container', () => {
      const { nodes, edges } = makeSequencedContainerFixture();
      expect(canSequenceContainer(nodes, 'nope')).toBe('missing-container');
      expect(projectContainerSequence(nodes, edges, 'nope')).toBeUndefined();
    });

    it('allows a body that holds a container with children of its own', () => {
      const { nodes } = makeRuntimeContainerFixture();
      expect(canSequenceContainer(nodes, rc.container)).toBeUndefined();
    });

    it('allows a childless container child and renders it as a row', () => {
      const { nodes, edges } = makeSequencedContainerFixture();
      const inner: Node = {
        id: 'inner',
        type: 'uipath.control-flow.foreach',
        parentId: ids.container,
        position: { x: 0, y: 400 },
        data: {},
      };
      const result = projectContainerSequence(
        [...nodes, inner],
        [...edges, { id: 'sc-transform-inner', source: ids.transform, target: 'inner' }],
        ids.container,
        { getBranchHandles: decisionBranches }
      );
      expect(canSequenceContainer([...nodes, inner], ids.container)).toBeUndefined();
      expect(rowIds(result!.projection.rows)).toContain('inner');
    });
  });

  it('leaves excluded children out of the rows and drops their edges', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const note: Node = {
      id: 'note',
      type: 'stickyNote',
      parentId: ids.container,
      position: { x: 0, y: 0 },
      data: {},
    };
    const result = projectContainerSequence(
      [...nodes, note],
      [...edges, { id: 'sc-validate-note', source: ids.validate, target: 'note' }],
      ids.container,
      { getBranchHandles: decisionBranches }
    )!;

    expect(rowIds(result.projection.rows)).not.toContain('note');
    expect(result.childIds.has('note')).toBe(false);
    expect(result.projection.connectors.some((c) => c.targetRowId === 'note')).toBe(false);
    // Validate still continues straight into Decision.
    expect(
      result.projection.connectors.some(
        (c) => c.sourceRowId === ids.validate && c.targetRowId === ids.decision && c.kind === 'step'
      )
    ).toBe(true);
  });

  it('does not mutate its inputs and keeps canonical children parented', () => {
    const { nodes, edges } = makeSequencedContainerFixture();
    const nodesBefore = structuredClone(nodes);
    const edgesBefore = structuredClone(edges);

    projectContainerSequence(nodes, edges, ids.container, { getBranchHandles: decisionBranches });

    expect(nodes).toEqual(nodesBefore);
    expect(edges).toEqual(edgesBefore);
    expect(nodes.find((n) => n.id === ids.validate)?.parentId).toBe(ids.container);
  });

  describe('runtime container with a nested For Each', () => {
    const innerSteps = [rc.step4, rc.step5, rc.step6, rc.step7];

    function projectRuntime(overrides: Parameters<typeof projectContainerSequence>[3] = {}) {
      const { nodes, edges } = makeRuntimeContainerFixture();
      const result = projectContainerSequence(nodes, edges, rc.container, overrides);
      if (!result) throw new Error('expected a container sequence');
      return result;
    }

    it('numbers the body 1 to 8 with the For Each body indented one level', () => {
      const { projection } = projectRuntime();
      const rows = projection.rows.filter((row) => row.stepNumber !== undefined);

      expect(rowIds(rows)).toEqual([
        rc.http,
        rc.javascript,
        rc.forEach,
        ...innerSteps,
        rc.sendMessage,
      ]);
      expect(rows.map((row) => row.stepNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(rows.find((row) => row.nodeId === rc.forEach)?.collapsible).toBe(true);
      for (const id of innerSteps) {
        expect(rows.find((row) => row.nodeId === id)?.depth).toBe(1);
      }
      for (const id of [rc.http, rc.javascript, rc.forEach, rc.sendMessage]) {
        expect(rows.find((row) => row.nodeId === id)?.depth).toBe(0);
      }
    });

    it('reports every descendant in childIds and leaves the outer graph out', () => {
      const { childIds, projection } = projectRuntime();

      for (const id of [rc.http, rc.javascript, rc.forEach, ...innerSteps, rc.sendMessage]) {
        expect(childIds.has(id)).toBe(true);
      }
      for (const id of [rc.container, rc.maestroA, rc.maestroB, rc.agent]) {
        expect(childIds.has(id)).toBe(false);
      }
      const referenced = projection.connectors.flatMap((c) => [c.sourceRowId, c.targetRowId]);
      expect(referenced).not.toContain(rc.container);
      expect(referenced).not.toContain(rc.agent);
    });

    it('hides a collapsed For Each body and closes the gap below it', () => {
      const { projection, layout } = projectRuntime({ collapsedStepIds: new Set([rc.forEach]) });
      const metrics = resolveSequenceMetrics();
      const rowFor = (id: string) => projection.rows.find((row) => row.nodeId === id);

      expect(rowFor(rc.forEach)?.collapsed).toBe(true);
      expect(rowFor(rc.forEach)?.visible).toBe(true);
      for (const id of innerSteps) expect(rowFor(id)?.visible).toBe(false);
      expect(rowFor(rc.sendMessage)?.stepNumber).toBe(8);
      expect(rowFor(rc.sendMessage)?.visible).toBe(true);
      expect(layout.positions.get(rc.sendMessage)?.y).toBe(
        layout.positions.get(rc.forEach)!.y + metrics.pitch
      );
    });

    it('stamps top-level slots with the runtime container and keeps nested slots on the For Each', () => {
      const { projection } = projectRuntime();
      const slotFor = (edgeId: string) => projection.slots.find((s) => s.graphEdgeId === edgeId);

      expect(slotFor('rc-http-js')?.containerId).toBe(rc.container);
      expect(slotFor('rc-foreach-send')?.containerId).toBe(rc.container);
      expect(slotFor('rc-4-5')?.containerId).toBe(rc.forEach);
      expect(slotFor('rc-6-7')?.containerId).toBe(rc.forEach);
      expect(projection.slots.every((slot) => slot.containerId !== undefined)).toBe(true);
    });

    it('folds a trigger child out of the rows through isStartNode', () => {
      const { nodes, edges } = makeRuntimeContainerFixture();
      const trigger: Node = {
        id: 'rc-trigger',
        type: 'uipath.manual-trigger',
        parentId: rc.container,
        position: { x: 0, y: -100 },
        data: {},
      };
      const result = projectContainerSequence(
        [...nodes, trigger],
        [...edges, { id: 'rc-trigger-http', source: 'rc-trigger', target: rc.http }],
        rc.container,
        { isStartNode: (node) => node.type === 'uipath.manual-trigger' }
      )!;

      expect(rowIds(result.projection.rows)).not.toContain('rc-trigger');
      expect(result.projection.rows[0]?.nodeId).toBe(rc.http);
      expect(result.projection.rows[0]?.stepNumber).toBe(1);
    });

    it('treats a trigger child as a plain step without isStartNode', () => {
      const { nodes, edges } = makeRuntimeContainerFixture();
      const trigger: Node = {
        id: 'rc-trigger',
        type: 'uipath.manual-trigger',
        parentId: rc.container,
        position: { x: 0, y: -100 },
        data: {},
      };
      const result = projectContainerSequence(
        [...nodes, trigger],
        [...edges, { id: 'rc-trigger-http', source: 'rc-trigger', target: rc.http }],
        rc.container
      )!;

      expect(result.projection.rows[0]?.nodeId).toBe('rc-trigger');
    });

    it('drops an excluded subtree together with its root', () => {
      const { nodes, edges } = makeRuntimeContainerFixture();
      const result = projectContainerSequence(nodes, edges, rc.container, {
        isSequenceNode: (node) => node.id !== rc.forEach,
      })!;

      expect(result.childIds.has(rc.forEach)).toBe(false);
      for (const id of innerSteps) expect(result.childIds.has(id)).toBe(false);
      expect(rowIds(result.projection.rows)).not.toContain(rc.step4);
    });

    it('does not mutate its inputs and keeps grandchildren parented to the For Each', () => {
      const { nodes, edges } = makeRuntimeContainerFixture();
      const nodesBefore = structuredClone(nodes);
      const edgesBefore = structuredClone(edges);

      projectRuntime();
      projectContainerSequence(nodes, edges, rc.container);

      expect(nodes).toEqual(nodesBefore);
      expect(edges).toEqual(edgesBefore);
      expect(nodes.find((n) => n.id === rc.step4)?.parentId).toBe(rc.forEach);
      expect(nodes.find((n) => n.id === rc.http)?.parentId).toBe(rc.container);
    });
  });

  it('handles an empty container body', () => {
    const container: Node = {
      id: 'c',
      type: 'uipath.control-flow.foreach',
      position: { x: 0, y: 0 },
      data: {},
    };
    const result = projectContainerSequence([container], [], 'c')!;

    expect(result.projection.rows).toEqual([]);
    expect(result.childIds.size).toBe(0);
    expect(result.layout.positions.size).toBe(0);
  });
});
