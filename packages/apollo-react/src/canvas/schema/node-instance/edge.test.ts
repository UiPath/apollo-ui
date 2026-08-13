import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Waypoint } from '../../components/Edges/shared/types';
import type { EdgeInstance, EdgeInstanceUiConfig, WaypointInstance } from './edge';
import { edgeSchema } from './edge';

const connection = {
  id: 'e1',
  sourceNodeId: 'a',
  sourcePort: 'output',
  targetNodeId: 'b',
  targetPort: 'input',
};

describe('edgeSchema', () => {
  it('round-trips a stored route so a save/reload keeps the user edits', () => {
    const parsed = edgeSchema.parse({
      ...connection,
      ui: { waypoints: [{ id: 'w1', x: 120, y: 240 }] },
    });

    expect(parsed.ui?.waypoints).toEqual([{ id: 'w1', x: 120, y: 240 }]);
  });

  it('round-trips a layout-produced route in its own field', () => {
    const parsed = edgeSchema.parse({
      ...connection,
      ui: { routedWaypoints: [{ id: 'r0', x: 60, y: 0 }] },
    });

    expect(parsed.ui?.routedWaypoints).toEqual([{ id: 'r0', x: 60, y: 0 }]);
    expect(parsed.ui?.waypoints).toBeUndefined();
  });

  it('keeps host-specific ui keys, so a file from a newer client survives an older one', () => {
    const parsed = edgeSchema.parse({
      ...connection,
      ui: { waypoints: [], hostOwnedFlag: true, futureField: { nested: 1 } },
    });

    expect(parsed.ui?.hostOwnedFlag).toBe(true);
    expect(parsed.ui?.futureField).toEqual({ nested: 1 });
  });

  it('round-trips the route provenance a host keeps both kinds of route in one field', () => {
    const parsed = edgeSchema.parse({
      ...connection,
      ui: { waypoints: [{ id: 'w1', x: 120, y: 240 }], autoRouted: true },
    });

    expect(parsed.ui?.autoRouted).toBe(true);
  });

  it('leaves ui absent for a straight edge rather than defaulting it', () => {
    const parsed = edgeSchema.parse(connection);

    expect('ui' in parsed).toBe(false);
  });

  it('normalises an explicit null ui to absent rather than failing the parse', () => {
    // `ui` is a new key, so a file written before it existed may carry a null
    // from a host that serialises every optional slot.
    const parsed = edgeSchema.parse({ ...connection, ui: null });

    expect(parsed.ui).toBeUndefined();
  });

  it('keeps null out of the parsed type so consumers only handle absent', () => {
    expectTypeOf<EdgeInstance['ui']>().toEqualTypeOf<EdgeInstanceUiConfig | undefined>();
  });

  it('rejects a malformed waypoint instead of silently dropping the route', () => {
    const result = edgeSchema.safeParse({
      ...connection,
      ui: { waypoints: [{ id: 'w1', x: '120', y: 240 }] },
    });

    expect(result.success).toBe(false);
  });

  it('describes the same waypoint shape the edge components render', () => {
    // A parsed instance is handed straight to `CanvasEdgeData.waypoints`, so the
    // two must not drift apart.
    expectTypeOf<WaypointInstance>().toEqualTypeOf<Waypoint>();
  });
});
