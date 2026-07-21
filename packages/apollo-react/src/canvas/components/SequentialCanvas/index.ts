/**
 * Public surface of the sequential view. Re-exported by `components/index.ts`, so
 * everything below ships from `@uipath/apollo-react/canvas` like any other canvas
 * component. Adding an export here makes it public API on the next release.
 *
 * The feature is nonetheless pre-GA, and its v1 limitations (documented in
 * `canvas/README.md` and at each limitation in code) mean these props are still
 * expected to change. That instability is communicated in the docs and release
 * notes rather than by withholding the export: an earlier attempt to fence it
 * behind a separate `@uipath/apollo-react/canvas/sequential` subpath was rejected,
 * since a second entry in package.json `exports` is just as installable and just as
 * breakable, so it signalled instability without actually reducing the commitment.
 * See `components/index.ts` for the full reasoning.
 */
export type {
  CanvasViewTransitionResult,
  PrepareCanvasViewTransitionOptions,
} from './prepareCanvasViewTransition';
export { prepareCanvasViewTransition } from './prepareCanvasViewTransition';
export { SequentialCanvas } from './SequentialCanvas';
export type { SequentialCanvasProps, ViewSwitcherProps } from './SequentialCanvas.types';
export type {
  SequentialViewContextValue,
  SequentialViewProviderProps,
} from './SequentialViewContext';
export { SequentialViewProvider, useSequentialView } from './SequentialViewContext';
export { synthesizePositionsForFlow } from './synthesizePositionsForFlow';
export { useCanvasViewMode } from './useCanvasViewMode';
export type { SequentialGraph, UseSequentialGraphArgs } from './useSequentialGraph';
export { deriveSequentialGraph, useSequentialGraph } from './useSequentialGraph';
export type {
  SequentialKeyboardRow,
  UseSequentialKeyboardArgs,
  UseSequentialKeyboardResult,
} from './useSequentialKeyboard';
export { useSequentialKeyboard } from './useSequentialKeyboard';
export { ViewSwitcher } from './ViewSwitcher';
