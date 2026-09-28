import * as Icons from '@uipath/apollo-react/canvas/icons';
import { Column, Row } from '@uipath/apollo-react/canvas/layouts';
import {
  type ViewportHelperFunctionOptions as BaseCanvasZoomOptions,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { Button } from '@uipath/apollo-wind';
import { memo, useCallback } from 'react';
import type { CanvasTranslations } from '../types';
import { CanvasIcon } from '../utils/icon-registry';
import { BASE_CANVAS_DEFAULTS } from './BaseCanvas/BaseCanvas.constants';
import type { BaseCanvasFitViewOptions } from './BaseCanvas/BaseCanvas.types';
import { CanvasTooltip } from './CanvasTooltip';
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
          <CanvasTooltip content={translations.organize} placement={placement}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={translations.organize}
              onClick={handleOrganize}
            >
              <Icons.OrganizeIcon />
            </Button>
          </CanvasTooltip>
        )}
        <CanvasTooltip content={translations.zoomIn} placement={placement}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={translations.zoomIn}
            onClick={handleZoomIn}
          >
            <CanvasIcon icon="plus" size={16} />
          </Button>
        </CanvasTooltip>
        <CanvasTooltip content={translations.zoomOut} placement={placement}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={translations.zoomOut}
            onClick={handleZoomOut}
          >
            <CanvasIcon icon="minus" size={16} />
          </Button>
        </CanvasTooltip>
        <CanvasTooltip content={translations.zoomToFit} placement={placement}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={translations.zoomToFit}
            onClick={handleFitToView}
          >
            <Icons.ZoomToFitIcon />
          </Button>
        </CanvasTooltip>
      </RootComponent>
    );
  }
);
