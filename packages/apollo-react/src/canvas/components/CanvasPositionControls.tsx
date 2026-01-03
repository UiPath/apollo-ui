import * as Icons from '@uipath/apollo-react/canvas/icons';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIconButton, ApTooltip } from '@uipath/apollo-react/material';
import { memo, useCallback } from 'react';
import type { CanvasTranslations } from '../types';
import { BASE_CANVAS_DEFAULTS } from './BaseCanvas/BaseCanvas.constants';
import type { BaseCanvasFitViewOptions } from './BaseCanvas/BaseCanvas.types';

export interface CanvasPositionControlsProps {
  orientation?: 'horizontal' | 'vertical';
  fitViewOptions?: BaseCanvasFitViewOptions;
  translations: CanvasTranslations;
  showOrganize?: boolean;
}

export const CanvasPositionControls = memo(
  ({
    orientation = 'horizontal',
    fitViewOptions,
    translations,
    showOrganize = true,
  }: CanvasPositionControlsProps) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
    const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
    const handleFitToView = useCallback(
      () => fitView(fitViewOptions ?? BASE_CANVAS_DEFAULTS.fitViewOptions),
      [fitView, fitViewOptions]
    );
    const handleOrganize = useCallback(() => {}, []);

    let RootComponent: React.ElementType = Column;
    let placement: 'left' | 'top' = 'left';
    if (orientation === 'horizontal') {
      RootComponent = Row;
      placement = 'top';
    }

    return (
      <RootComponent data-testid="canvas-controls">
        {showOrganize && (
          <ApTooltip
            content={translations.organize}
            placement={placement}
            data-testid="organize-button"
          >
            <ApIconButton color="secondary" onClick={handleOrganize}>
              <Icons.OrganizeIcon />
            </ApIconButton>
          </ApTooltip>
        )}
        <ApTooltip content={translations.zoomIn} placement={placement} data-testid="zoom-in-button">
          <ApIconButton color="secondary" onClick={handleZoomIn}>
            <Icons.ZoomInIcon />
          </ApIconButton>
        </ApTooltip>
        <ApTooltip
          content={translations.zoomOut}
          placement={placement}
          data-testid="zoom-out-button"
        >
          <ApIconButton color="secondary" onClick={handleZoomOut}>
            <Icons.ZoomOutIcon />
          </ApIconButton>
        </ApTooltip>
        <ApTooltip
          content={translations.zoomToFit}
          placement={placement}
          data-testid="fit-to-view-button"
        >
          <ApIconButton color="secondary" onClick={handleFitToView}>
            <Icons.ZoomToFitIcon />
          </ApIconButton>
        </ApTooltip>
      </RootComponent>
    );
  }
);
