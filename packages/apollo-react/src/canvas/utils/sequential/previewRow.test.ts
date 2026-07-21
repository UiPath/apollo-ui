import { describe, expect, it } from 'vitest';
import { PREVIEW_NODE_ID, SEQ_BAR_HEIGHT, SEQ_ROW_GAP } from '../../constants';
import { layoutSequence } from './layoutSequence';
import { projectionWithPreviewRow } from './previewRow';
import type { SequenceConnector, SequenceProjection, SequenceRow } from './sequential.types';

const PITCH = SEQ_BAR_HEIGHT + SEQ_ROW_GAP;

function row(nodeId: string, depth: number, parentRowId?: string): SequenceRow {
  return { nodeId, depth, parentRowId, collapsible: false, collapsed: false, visible: true };
}

function projection(rows: SequenceRow[], connectors: SequenceConnector[] = []): SequenceProjection {
  return { rows, connectors, slots: connectors.flatMap((connector) => connector.slot ?? []) };
}

function ids(proj: SequenceProjection): string[] {
  return proj.rows.map((r) => r.nodeId);
}

function previewRow(proj: SequenceProjection): SequenceRow | undefined {
  return proj.rows.find((r) => r.nodeId === PREVIEW_NODE_ID);
}

describe('projectionWithPreviewRow', () => {
  it('splices the preview row before a splice target, at the target depth', () => {
    const base = projection([row('a', 0), row('b', 1, 'a'), row('c', 0)]);
    const next = projectionWithPreviewRow(base, { id: 's', target: { nodeId: 'b' } });

    expect(ids(next)).toEqual(['a', PREVIEW_NODE_ID, 'b', 'c']);
    expect(previewRow(next)).toMatchObject({ depth: 1, parentRowId: 'a' });
    // base is untouched (pure).
    expect(ids(base)).toEqual(['a', 'b', 'c']);
  });

  it('appends a sibling/leaf after the source subtree, at the source depth', () => {
    // b (depth 0) owns a subtree [b-child]; appending after b lands past it.
    const base = projection([row('a', 0), row('b', 0), row('b-child', 1, 'b'), row('c', 0)]);
    const next = projectionWithPreviewRow(base, { id: 's', source: { nodeId: 'b' } });

    expect(ids(next)).toEqual(['a', 'b', 'b-child', PREVIEW_NODE_ID, 'c']);
    expect(previewRow(next)).toMatchObject({ depth: 0, parentRowId: undefined });
  });

  it('appends as the first child of an empty container (one level deeper)', () => {
    const base = projection([row('a', 0), row('k', 0), row('c', 0)]);
    const next = projectionWithPreviewRow(base, {
      id: 's',
      source: { nodeId: 'k' },
      containerId: 'k',
    });

    expect(ids(next)).toEqual(['a', 'k', PREVIEW_NODE_ID, 'c']);
    expect(previewRow(next)).toMatchObject({ depth: 1, parentRowId: 'k' });
  });

  it('appends at the very end for a tail append', () => {
    const base = projection([row('a', 0), row('b', 0)]);
    const next = projectionWithPreviewRow(base, { id: 's', source: { nodeId: 'b' } });

    expect(ids(next)).toEqual(['a', 'b', PREVIEW_NODE_ID]);
  });

  it('swaps an empty lane placeholder for the preview in place', () => {
    // A lane placeholder occupies the lane's slot; inserting into it must keep
    // that depth/parent, not run the generic append (which would land at the
    // parent's depth).
    const laneRow: SequenceRow = {
      nodeId: '__sequential-lane__if::true',
      depth: 1,
      parentRowId: 'if',
      collapsible: false,
      collapsed: false,
      visible: true,
      branch: { sourceNodeId: 'if', handleId: 'true', label: 'Then' },
      lanePlaceholder: { id: 'slot:lane:if:true', source: { nodeId: 'if', handleId: 'true' } },
    };
    const base = projection([row('if', 0), laneRow, row('c', 0)]);
    const next = projectionWithPreviewRow(base, { id: 'slot:lane:if:true' });

    // The placeholder is replaced (not added) by the preview, at its depth/parent.
    expect(ids(next)).toEqual(['if', PREVIEW_NODE_ID, 'c']);
    expect(previewRow(next)).toMatchObject({
      depth: 1,
      parentRowId: 'if',
      branch: { handleId: 'true', label: 'Then' },
    });
  });

  it('returns the projection unchanged when the anchor row is absent', () => {
    const base = projection([row('a', 0)]);
    expect(projectionWithPreviewRow(base, { id: 's', target: { nodeId: 'missing' } })).toBe(base);
    expect(projectionWithPreviewRow(base, { id: 's' })).toBe(base);
  });

  it('opens a one-row gap in the layout: downstream rows shift by one pitch', () => {
    const base = projection([row('a', 0), row('b', 0), row('c', 0)]);
    const withPreview = projectionWithPreviewRow(base, { id: 's', target: { nodeId: 'b' } });
    const layout = layoutSequence(withPreview);

    expect(layout.positions.get('a')?.y).toBe(0);
    // The preview takes b's original slot; b and c each drop by one pitch.
    expect(layout.positions.get(PREVIEW_NODE_ID)?.y).toBe(PITCH);
    expect(layout.positions.get('b')?.y).toBe(2 * PITCH);
    expect(layout.positions.get('c')?.y).toBe(3 * PITCH);
  });

  it('replaces a split connector with preview connectors using final row geometry', () => {
    const slot = {
      id: 'slot:edge:a-b',
      source: { nodeId: 'a', handleId: 'output' },
      target: { nodeId: 'b', handleId: 'input' },
      graphEdgeId: 'a-b',
    };
    const base = projection(
      [row('a', 0), row('b', 0)],
      [
        {
          id: 'conn:a-b',
          kind: 'step',
          sourceRowId: 'a',
          targetRowId: 'b',
          slot,
        },
      ]
    );

    const next = projectionWithPreviewRow(base, slot);
    expect(next.connectors).toEqual([
      expect.objectContaining({
        kind: 'step',
        sourceRowId: 'a',
        targetRowId: PREVIEW_NODE_ID,
      }),
      expect.objectContaining({
        kind: 'step',
        sourceRowId: PREVIEW_NODE_ID,
        targetRowId: 'b',
      }),
    ]);
    expect(next.connectors.some((connector) => connector.id === 'conn:a-b')).toBe(false);

    const previewLayout = layoutSequence(next);
    const committed = projection(
      [row('a', 0), row('new', 0), row('b', 0)],
      next.connectors.map((connector) => ({
        ...connector,
        id: connector.id.replace('preview:', 'committed:'),
        sourceRowId: connector.sourceRowId === PREVIEW_NODE_ID ? 'new' : connector.sourceRowId,
        targetRowId: connector.targetRowId === PREVIEW_NODE_ID ? 'new' : connector.targetRowId,
      }))
    );
    const committedLayout = layoutSequence(committed);

    expect(previewLayout.positions.get(PREVIEW_NODE_ID)).toEqual(
      committedLayout.positions.get('new')
    );
  });

  it('preserves branch-entry routing when an empty lane placeholder becomes a preview', () => {
    const slot = { id: 'slot:lane:if:true', source: { nodeId: 'if', handleId: 'true' } };
    const laneRow: SequenceRow = {
      ...row('__sequential-lane__if::true', 1, 'if'),
      branch: { sourceNodeId: 'if', handleId: 'true', label: 'Then' },
      lanePlaceholder: slot,
    };
    const base = projection(
      [row('if', 0), laneRow],
      [
        {
          id: 'conn:lane:if:true',
          kind: 'branch-entry',
          sourceRowId: 'if',
          targetRowId: laneRow.nodeId,
          label: 'Then',
        },
      ]
    );

    const next = projectionWithPreviewRow(base, slot);
    const incoming = next.connectors.find((connector) => connector.targetRowId === PREVIEW_NODE_ID);
    expect(incoming).toMatchObject({
      kind: 'branch-entry',
      sourceRowId: 'if',
      targetRowId: PREVIEW_NODE_ID,
      label: 'Then',
    });
    expect(layoutSequence(next).connectorWaypoints.get(incoming!.id)).toHaveLength(2);
  });
});
