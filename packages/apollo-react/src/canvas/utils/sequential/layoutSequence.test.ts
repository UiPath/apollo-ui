import { describe, expect, it } from 'vitest';
import { SEQ_BAR_HEIGHT, SEQ_BAR_WIDTH, SEQ_INDENT_PX, SEQ_ROW_GAP } from '../../constants';
import {
  makeDiamondFixture,
  makeOrphanFixture,
  makeWireframeFixture,
  WIREFRAME_NODE_IDS,
} from './fixtures';
import { layoutSequence } from './layoutSequence';
import { projectSequence } from './projectSequence';
import type { SequenceConnector, SequenceProjection } from './sequential.types';

const PITCH = SEQ_BAR_HEIGHT + SEQ_ROW_GAP;

function connector(
  projection: SequenceProjection,
  source: string,
  target: string
): SequenceConnector {
  const found = projection.connectors.find(
    (c) => c.sourceRowId === source && c.targetRowId === target
  );
  if (!found) throw new Error(`connector ${source}->${target} not found`);
  return found;
}

describe('layoutSequence', () => {
  const ids = WIREFRAME_NODE_IDS;

  describe('wireframe geometry', () => {
    const { nodes, edges } = makeWireframeFixture();
    const layout = layoutSequence(projectSequence(nodes, edges));

    it('stacks visible rows at a fixed pitch and indents by depth', () => {
      expect(layout.positions.get(ids.http)).toEqual({ x: 0, y: 0 });
      expect(layout.positions.get(ids.javascript)).toEqual({ x: 0, y: PITCH });
      expect(layout.positions.get(ids.forEach)).toEqual({ x: 0, y: 2 * PITCH });
      expect(layout.positions.get(ids.ifNode)).toEqual({ x: SEQ_INDENT_PX, y: 3 * PITCH });
      expect(layout.positions.get(ids.thenJs)).toEqual({ x: 2 * SEQ_INDENT_PX, y: 4 * PITCH });
      expect(layout.positions.get(ids.elseHttp)).toEqual({ x: 2 * SEQ_INDENT_PX, y: 5 * PITCH });
      expect(layout.positions.get(ids.sendMessage)).toEqual({ x: 0, y: 6 * PITCH });
    });

    it('computes bounds spanning the deepest and lowest rows', () => {
      expect(layout.bounds).toEqual({
        x: 0,
        y: 0,
        width: 2 * SEQ_INDENT_PX + SEQ_BAR_WIDTH,
        height: 6 * PITCH + SEQ_BAR_HEIGHT,
      });
    });
  });

  describe('collapse closes the vertical gap', () => {
    const { nodes, edges } = makeWireframeFixture();
    const layout = layoutSequence(
      projectSequence(nodes, edges, { collapsedStepIds: new Set([ids.forEach]) })
    );

    it('advances y only over visible rows', () => {
      expect(layout.positions.get(ids.http)).toEqual({ x: 0, y: 0 });
      expect(layout.positions.get(ids.javascript)).toEqual({ x: 0, y: PITCH });
      expect(layout.positions.get(ids.forEach)).toEqual({ x: 0, y: 2 * PITCH });
      expect(layout.positions.get(ids.sendMessage)).toEqual({ x: 0, y: 3 * PITCH });
    });

    it('parks hidden rows at their collapsed ancestor y', () => {
      const containerY = layout.positions.get(ids.forEach)?.y;
      expect(layout.positions.get(ids.ifNode)?.y).toBe(containerY);
      expect(layout.positions.get(ids.thenJs)?.y).toBe(containerY);
    });

    it('excludes hidden rows from the bounds height', () => {
      expect(layout.bounds.height).toBe(3 * PITCH + SEQ_BAR_HEIGHT);
    });
  });

  describe('merge-back waypoints', () => {
    const { nodes, edges } = makeDiamondFixture();
    const projection = projectSequence(nodes, edges);
    const layout = layoutSequence(projection);

    it('routes an earlier branch through source-exit, corridor, and target-entry waypoints', () => {
      const waypoints = layout.connectorWaypoints.get(connector(projection, 'b', 'd').id);
      expect(waypoints).toHaveLength(4);
      // Middle pair is the vertical corridor; outer pair align with the handles.
      expect(waypoints?.[1]?.x).toBe(waypoints?.[2]?.x);
      expect(waypoints?.[0]?.y).toBe(waypoints?.[1]?.y);
      expect(waypoints?.[2]?.y).toBe(waypoints?.[3]?.y);
      expect(waypoints?.every((w) => typeof w.id === 'string')).toBe(true);
    });

    it('routes the lowest branch directly into the target entry without doubling back', () => {
      const waypoints = layout.connectorWaypoints.get(connector(projection, 'c', 'd').id);
      expect(waypoints).toHaveLength(2);
      expect(waypoints?.[0]?.y).toBe(waypoints?.[1]?.y);
      expect(waypoints?.[0]?.x ?? 0).toBeGreaterThan(waypoints?.[1]?.x ?? 0);
    });

    it('bundles branches converging on one target into a shared join trunk', () => {
      const first = layout.connectorWaypoints.get(connector(projection, 'b', 'd').id);
      const second = layout.connectorWaypoints.get(connector(projection, 'c', 'd').id);

      expect(first?.[3]).toMatchObject({ x: second?.[1]?.x, y: second?.[1]?.y });
    });

    it('routes the corridor strictly left of every row it could cross (F5 regression)', () => {
      // b->d must descend past sibling row c without crossing its bar.
      const waypoints = layout.connectorWaypoints.get(connector(projection, 'b', 'd').id);
      const corridorX = waypoints?.[1]?.x ?? Number.POSITIVE_INFINITY;
      const allRowLeftEdges = projection.rows.map((r) => layout.positions.get(r.nodeId)?.x ?? 0);
      for (const rowX of allRowLeftEdges) {
        expect(corridorX).toBeLessThan(rowX);
      }
    });

    it('handle-routes step connectors (no waypoints) but elbows every branch lane', () => {
      for (const c of projection.connectors) {
        if (c.kind === 'step') {
          expect(layout.connectorWaypoints.has(c.id)).toBe(false);
        }
      }
      for (const target of ['b', 'c']) {
        const waypoints = layout.connectorWaypoints.get(connector(projection, 'if', target).id);
        expect(waypoints, target).toHaveLength(2);
        expect(waypoints?.[0]?.y).toBe(waypoints?.[1]?.y);
      }
    });

    it('shares one vertical spine (the owner handle column) across all lanes', () => {
      const first = layout.connectorWaypoints.get(connector(projection, 'if', 'b').id);
      const second = layout.connectorWaypoints.get(connector(projection, 'if', 'c').id);
      expect(first?.[0]?.x).toBe(second?.[0]?.x);
      expect(second?.[0]?.y ?? 0).toBeGreaterThan(first?.[0]?.y ?? 0);
    });
  });

  describe('container-continuation merge-back waypoints (wireframe, defect 5 regression)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const layout = layoutSequence(projection);

    it('drops For Each -> Send Message straight down the shared spine (no corridor jog)', () => {
      // Source and target share a depth and the body rows between are all deeper.
      const c = connector(projection, ids.forEach, ids.sendMessage);
      expect(c.kind).toBe('merge-back');
      expect(layout.connectorWaypoints.has(c.id)).toBe(false);

      const forEachPos = layout.positions.get(ids.forEach);
      const sendMessagePos = layout.positions.get(ids.sendMessage);
      expect(forEachPos?.x).toBe(sendMessagePos?.x);
    });

    it('does not add waypoints to the still-plain step connectors', () => {
      expect(
        layout.connectorWaypoints.has(connector(projection, ids.http, ids.javascript).id)
      ).toBe(false);
      expect(
        layout.connectorWaypoints.has(connector(projection, ids.javascript, ids.forEach).id)
      ).toBe(false);
    });
  });

  describe('branch-entry waypoints never cross a sibling lane’s bar (wireframe regression)', () => {
    const { nodes, edges } = makeWireframeFixture();
    const projection = projectSequence(nodes, edges);
    const layout = layoutSequence(projection);

    function rowBand(nodeId: string): { left: number; right: number; top: number; bottom: number } {
      const position = layout.positions.get(nodeId);
      if (!position) throw new Error(`no position for ${nodeId}`);
      return {
        left: position.x,
        right: position.x + SEQ_BAR_WIDTH,
        top: position.y,
        bottom: position.y + SEQ_BAR_HEIGHT,
      };
    }

    it('routes every branch lane (spine drop + gap jog) clear of all other rows', () => {
      const branchEntries = projection.connectors.filter((c) => c.kind === 'branch-entry');
      let checked = 0;

      for (const c of branchEntries) {
        const waypoints = layout.connectorWaypoints.get(c.id);
        expect(waypoints, c.id).toHaveLength(2);
        if (!waypoints) continue;
        checked++;
        const source = layout.positions.get(c.sourceRowId);
        if (!source) throw new Error(`no position for ${c.sourceRowId}`);
        const [wp0, wp1] = waypoints;

        const spineX = wp0?.x ?? Number.NaN;
        const spineTop = Math.min(source.y + SEQ_BAR_HEIGHT, wp0?.y ?? 0);
        const spineBottom = Math.max(source.y + SEQ_BAR_HEIGHT, wp0?.y ?? 0);
        const jogY = wp0?.y ?? Number.NaN;
        const jogLeft = Math.min(wp0?.x ?? 0, wp1?.x ?? 0);
        const jogRight = Math.max(wp0?.x ?? 0, wp1?.x ?? 0);

        const otherRowIds = projection.rows
          .map((r) => r.nodeId)
          .filter((id) => id !== c.sourceRowId && id !== c.targetRowId);

        for (const nodeId of otherRowIds) {
          const band = rowBand(nodeId);
          const spineCrosses =
            spineX >= band.left &&
            spineX <= band.right &&
            spineBottom > band.top &&
            spineTop < band.bottom;
          const jogCrosses =
            jogY > band.top && jogY < band.bottom && jogRight > band.left && jogLeft < band.right;
          expect(spineCrosses || jogCrosses, `${c.id} crosses ${nodeId}'s band`).toBe(false);
        }
      }

      expect(checked).toBeGreaterThan(0);
    });
  });

  describe('custom geometry options', () => {
    it('honours overridden bar/gap/indent dimensions', () => {
      const { nodes, edges } = makeWireframeFixture();
      const layout = layoutSequence(projectSequence(nodes, edges), {
        barWidth: 400,
        barHeight: 40,
        rowGap: 10,
        indent: 20,
      });
      expect(layout.positions.get(ids.javascript)).toEqual({ x: 0, y: 50 });
      expect(layout.positions.get(ids.ifNode)).toEqual({ x: 20, y: 150 });
      expect(layout.bounds.width).toBe(2 * 20 + 400);
    });
  });

  it('reserves a placeholder pitch before the trailing orphan section', () => {
    const { nodes, edges } = makeOrphanFixture();
    const projection = projectSequence(nodes, edges);
    const layout = layoutSequence(projection);
    const b = layout.positions.get('b');
    const orphan = layout.positions.get('z');
    expect(b).toBeDefined();
    expect(orphan?.y).toBe((b?.y ?? 0) + PITCH * 2);
  });
});
