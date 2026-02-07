import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type { ReactNode } from 'react';
import type { BaseCanvasProps } from './BaseCanvas.types';
import { BaseCanvasModeProvider } from './BaseCanvasModeProvider';
import { CanvasThemeProvider } from './CanvasThemeContext';
import { ConnectedHandlesProvider } from './ConnectedHandlesContext';
import { SelectionStateProvider } from './SelectionStateContext';

interface CanvasProvidersProps {
  children: ReactNode;
  nodes: Node[];
  edges: Edge[];
  mode: BaseCanvasProps['mode'];
  isDarkMode?: boolean;
}

/**
 * Combines canvas context providers into a single wrapper component.
 * Each provider remains separate internally to preserve granular re-render behavior.
 *
 * This is purely a convenience wrapper - no performance implications.
 */
export function CanvasProviders({
  nodes,
  edges,
  mode,
  isDarkMode,
  children,
}: CanvasProvidersProps) {
  return (
    <CanvasThemeProvider isDarkMode={isDarkMode}>
      <ConnectedHandlesProvider edges={edges}>
        <BaseCanvasModeProvider mode={mode}>
          <SelectionStateProvider nodes={nodes}>{children}</SelectionStateProvider>
        </BaseCanvasModeProvider>
      </ConnectedHandlesProvider>
    </CanvasThemeProvider>
  );
}
