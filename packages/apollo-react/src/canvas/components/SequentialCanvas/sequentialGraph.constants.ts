/**
 * Shared, dependency-free constants for the sequential graph derivation
 * (useSequentialGraph), the connector edges, and the change filters. Kept in its
 * own module so the pure change-filter helpers don't pull in the React hook.
 */

/** Edge `type` the derivation stamps on every connector edge (the registered connector edge type). */
export const SEQ_CONNECTOR_EDGE_TYPE = 'sequentialConnector';

/**
 * Stable node ids for the two synthetic rows the derivation injects view-only.
 * They are filtered out of onNodesChange / onEdgesChange before forwarding, and
 * never appear in canonical state. The double-underscore fencing keeps them from
 * colliding with any real node id.
 */
export const SEQ_START_ROW_ID = '__sequential-start__';
export const SEQ_PLACEHOLDER_ROW_ID = '__sequential-placeholder__';

/** Edge ids for the synthetic connectors joining the start/placeholder bars. */
export const SEQ_START_EDGE_ID = '__sequential-start-edge__';
export const SEQ_PLACEHOLDER_EDGE_ID = '__sequential-placeholder-edge__';

/**
 * Node-count ceiling under which the sequential view renders EVERY row into the
 * DOM (onlyRenderVisibleElements={false}) so reading order equals row order for
 * screen readers (D8). Above it, xyflow's viewport virtualization is re-enabled
 * (matching the flow canvas default): rendering many hundred fixed bars at once
 * makes xyflow fire updateNodeInternals for all of them on mount, and that burst
 * drives xyflow's own ResizeObserver / store-rerender cycle past React's nested
 * update limit. Real sequential flows sit far below this; a run this large is a
 * navigable list only in the loosest sense, so trading full-DOM a11y for
 * virtualization stability at that scale is the right call. Documented tradeoff.
 */
export const SEQ_FULL_RENDER_MAX_NODES = 150;
