/**
 * Public surface of the sequential view, shipped from `@uipath/apollo-react/canvas`. The
 * feature is pre-GA; instability is communicated in docs and release notes, not by
 * withholding the export.
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
export { useCanvasViewMode } from './useCanvasViewMode';
export { ViewSwitcher } from './ViewSwitcher';
// Internals such as useSequentialGraph and useSequentialKeyboard are deliberately not
// exported; the pure engine they wrap is public from `utils/sequential`.
