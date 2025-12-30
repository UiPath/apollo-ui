import type { ReactNode } from 'react';
import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { ConnectedHandlesProvider } from './ConnectedHandlesContext';
import { BaseCanvasModeProvider } from './BaseCanvasModeProvider';
import { SelectionStateProvider } from './SelectionStateContext';
import type { BaseCanvasProps } from './BaseCanvas.types';

interface CanvasProvidersProps {
  nodes: Node[];
  edges: Edge[];
  mode: BaseCanvasProps['mode'];
  children: ReactNode;
}

/**
 * Combines canvas context providers into a single wrapper component.
 * Each provider remains separate internally to preserve granular re-render behavior.
 *
 * This is purely a convenience wrapper - no performance implications.
 */
export function CanvasProviders({ nodes, edges, mode, children }: CanvasProvidersProps) {
  return (
    <ConnectedHandlesProvider edges={edges}>
      <BaseCanvasModeProvider mode={mode}>
        <SelectionStateProvider nodes={nodes}>{children}</SelectionStateProvider>
      </BaseCanvasModeProvider>
    </ConnectedHandlesProvider>
  );
}
