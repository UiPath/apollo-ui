/** Dependency-free constants, so the pure change-filter helpers do not pull in the React hook. */

/** Edge `type` stamped on every connector edge. */
export const SEQ_CONNECTOR_EDGE_TYPE = 'sequentialConnector';

/** Ids of the two view-only synthetic rows; never forwarded to canonical state. */
export const SEQ_START_ROW_ID = '__sequential-start__';
export const SEQ_PLACEHOLDER_ROW_ID = '__sequential-placeholder__';

/** Ids of the synthetic connectors joining the start/placeholder bars. */
export const SEQ_START_EDGE_ID = '__sequential-start-edge__';
export const SEQ_PLACEHOLDER_EDGE_ID = '__sequential-placeholder-edge__';

/**
 * Below this step count every row renders into the DOM so reading order equals row order.
 * Above it xyflow virtualization is re-enabled: mounting many hundred bars at once drives
 * xyflow's updateNodeInternals / ResizeObserver cycle past React's nested-update limit.
 */
export const SEQ_FULL_RENDER_MAX_NODES = 150;
