import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { TooltipProvider } from '@uipath/apollo-wind/components/ui/tooltip';
import type { ReactNode } from 'react';
import { ApI18nProvider } from '../../../i18n';
import { CanvasTooltipProviderMarker } from '../CanvasTooltip';
import { StickyNoteCanvasOptionsProvider } from '../StickyNoteNode/StickyNoteCanvasOptionsContext';
import type { StickyNoteCanvasOptions } from '../StickyNoteNode/StickyNoteNode.types';
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
  locale?: BaseCanvasProps['locale'];
  stickyNoteOptions?: StickyNoteCanvasOptions;
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
  locale,
  stickyNoteOptions,
  children,
}: CanvasProvidersProps) {
  return (
    <ApI18nProvider component="canvas" locale={locale}>
      <CanvasThemeProvider isDarkMode={isDarkMode}>
        <TooltipProvider delayDuration={200} skipDelayDuration={100}>
          <CanvasTooltipProviderMarker>
            <ConnectedHandlesProvider edges={edges}>
              <BaseCanvasModeProvider mode={mode}>
                <StickyNoteCanvasOptionsProvider options={stickyNoteOptions}>
                  <SelectionStateProvider nodes={nodes}>{children}</SelectionStateProvider>
                </StickyNoteCanvasOptionsProvider>
              </BaseCanvasModeProvider>
            </ConnectedHandlesProvider>
          </CanvasTooltipProviderMarker>
        </TooltipProvider>
      </CanvasThemeProvider>
    </ApI18nProvider>
  );
}
