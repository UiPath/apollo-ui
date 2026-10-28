/**
 * ProbeCard — floating debug card for canvas node output inspection.
 *
 * Import from the canvas barrel:
 * ```ts
 * import { ProbeCard } from '@uipath/apollo-react/canvas';
 * import type { WatchResult, IterationControl, ProbeCardProps, ResizeEdges } from '@uipath/apollo-react/canvas';
 * ```
 *
 * The card is UI-only. Callers own:
 * - **Position & size** — calculated from node canvas→screen coordinates
 * - **Watch list** — expressions + pre-evaluated `WatchResult[]` values
 * - **Connector line** — SVG dashed line from node edge to card center
 * - **Store** — persistence (localStorage, Zustand, etc.)
 *
 * See `ProbeCardProps` for the full callback contract.
 */

export type { IterationControl, ProbeCardProps, WatchResult } from './ProbeCard';
export { ProbeCard } from './ProbeCard';
export type { ResizeEdges } from './ProbeResizeHandles';
