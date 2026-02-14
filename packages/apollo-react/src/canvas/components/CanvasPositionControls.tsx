import token from '@uipath/apollo-core';
import * as Icons from '@uipath/apollo-react/canvas/icons';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import {
  type ViewportHelperFunctionOptions as BaseCanvasZoomOptions,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon, ApIconButton, ApTooltip } from '@uipath/apollo-react/material';
import { memo, useCallback } from 'react';
import type { CanvasTranslations } from '../types';
import { BASE_CANVAS_DEFAULTS } from './BaseCanvas/BaseCanvas.constants';
import type { BaseCanvasFitViewOptions } from './BaseCanvas/BaseCanvas.types';
export type { BaseCanvasZoomOptions };

export interface CanvasPositionControlsProps {
  orientation?: 'horizontal' | 'vertical';
  fitViewOptions?: BaseCanvasFitViewOptions;
  zoomInOptions?: BaseCanvasZoomOptions;
  zoomOutOptions?: BaseCanvasZoomOptions;
  translations: CanvasTranslations;
  onOrganize?: () => void;
}

export const CanvasPositionControls = memo(
  ({
    orientation = 'horizontal',
    fitViewOptions,
    zoomInOptions,
    zoomOutOptions,
    translations,
    onOrganize,
  }: CanvasPositionControlsProps) => {
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const handleZoomIn = useCallback(() => zoomIn(zoomInOptions), [zoomIn, zoomInOptions]);
    const handleZoomOut = useCallback(() => zoomOut(zoomOutOptions), [zoomOut, zoomOutOptions]);
    const handleFitToView = useCallback(
      () => fitView(fitViewOptions ?? BASE_CANVAS_DEFAULTS.fitViewOptions),
      [fitView, fitViewOptions]
    );
    const handleOrganize = useCallback(() => onOrganize?.(), [onOrganize]);

    const showOrganize = !!onOrganize;

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
            <ApIcon name="add" size={token.Icon.IconXs} />
          </ApIconButton>
        </ApTooltip>
        <ApTooltip
          content={translations.zoomOut}
          placement={placement}
          data-testid="zoom-out-button"
        >
          <ApIconButton color="secondary" onClick={handleZoomOut}>
            <ApIcon name="remove" size={token.Icon.IconXs} />
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
