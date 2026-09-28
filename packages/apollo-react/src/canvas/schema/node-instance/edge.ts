import { z } from 'zod';
import { idSchema } from './base';

/**
 * A single bend in an edge's route, in absolute canvas coordinates.
 *
 * Structurally identical to the `Waypoint` type the edge components render, so a
 * parsed instance can be handed straight to `CanvasEdgeData.waypoints` (and back)
 * without a mapping step.
 */
export const waypointSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
});

/**
 * UI configuration for edge rendering (how the line is routed).
 *
 * The counterpart to a node's `ui` slot: layout that belongs to the drawing
 * rather than to the workflow. Optional, because most edges are straight and
 * carry no stored route.
 *
 * `waypoints` are user-placed and authoritative. `routedWaypoints` come from a
 * layout engine or an `EdgeRouter` and are only drawn when there are no manual
 * waypoints. Which of the two a route is stored in is not just bookkeeping: the
 * renderer applies node-face clearance to routed bends only, so a layout route
 * promoted to `waypoints` draws differently unless `autoRouted` says otherwise.
 *
 * The `catchall` keeps host-specific keys, and keys written by a newer client,
 * intact through a parse instead of silently dropping them.
 */
export const edgeUiSchema = z
  .object({
    /** User-placed bends. Take priority over `routedWaypoints` when present. */
    waypoints: z.array(waypointSchema).optional(),
    /** Bends produced by a layout engine or `EdgeRouter`. */
    routedWaypoints: z.array(waypointSchema).optional(),
    /**
     * Whether the stored route is layout-produced rather than user-placed, for
     * hosts that keep both kinds in one field. Maps to `CanvasEdgeData.autoRouted`;
     * omit it to let the renderer infer from which field the route is in.
     */
    autoRouted: z.boolean().optional(),
  })
  .catchall(z.unknown()); // Allow additional UI properties

/**
 * A connection between nodes in a workflow
 */
export const edgeSchema = z.object({
  id: idSchema,
  sourceNodeId: idSchema,
  /** The source port name (output port) */
  sourcePort: z.string().min(1),
  targetNodeId: idSchema,
  /** The target port name (input port) */
  targetPort: z.string().min(1),
  /**
   * UI configuration (edge route). Absent when the edge has no stored route.
   *
   * `null` is accepted and normalised to absent: this key is new, so a file
   * written before it existed may carry an explicit null from a host that
   * serialises every optional slot, and rejecting those would fail the whole
   * parse at load time over a route that isn't there.
   */
  ui: edgeUiSchema
    .nullish()
    .transform((value) => value ?? undefined)
    .optional(),
  data: z
    .object({
      /** Optional label displayed at the edge midpoint */
      label: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

// Export inferred TypeScript types
export type WaypointInstance = z.infer<typeof waypointSchema>;

export type EdgeInstanceUiConfig = z.infer<typeof edgeUiSchema>;

export type EdgeInstance = z.infer<typeof edgeSchema>;
