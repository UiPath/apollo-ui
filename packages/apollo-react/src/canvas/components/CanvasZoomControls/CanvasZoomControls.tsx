import { forwardRef, memo, useCallback } from 'react';
import { BrushCleaning, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ToolbarButton } from '../ToolbarButton';
import { useSafeLingui } from '../../../i18n';

export interface CanvasZoomControlsProps {
  orientation?: 'vertical' | 'horizontal';
  fitViewOptions?: { duration?: number; padding?: number; maxZoom?: number };
  zoomInOptions?: { duration?: number };
  zoomOutOptions?: { duration?: number };
  onOrganize?: () => void;
  onFitView?: () => void;
}

const ZOOM_ICON_BUTTON_CLASS =
  'text-foreground-muted hover:bg-surface-hover hover:text-foreground [&_svg]:size-[18px] [&_svg]:transition-all hover:[&_svg]:size-[22px] disabled:hover:[&_svg]:size-[18px]';

export const CanvasZoomControls = memo(
  forwardRef<HTMLDivElement, CanvasZoomControlsProps>(function CanvasZoomControls(
    {
      orientation = 'vertical',
      fitViewOptions,
      zoomInOptions,
      zoomOutOptions,
      onOrganize,
      onFitView,
    },
    ref
  ) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { _ } = useSafeLingui();
    const isVertical = orientation === 'vertical';
    const tooltipSide = isVertical ? 'left' : ('top' as const);

    const handleZoomIn = useCallback(() => {
      zoomIn(zoomInOptions);
    }, [zoomIn, zoomInOptions]);

    const handleZoomOut = useCallback(() => {
      zoomOut(zoomOutOptions);
    }, [zoomOut, zoomOutOptions]);

    const handleFitView = useCallback(() => {
      if (onFitView) {
        onFitView();
      } else {
        fitView(fitViewOptions);
      }
    }, [onFitView, fitView, fitViewOptions]);

    return (
      <div
        ref={ref}
        data-testid="canvas-controls"
        className={`flex gap-1 items-center rounded-xl border border-border-subtle bg-surface-raised text-foreground p-1 backdrop-blur-sm shadow-lg ${
          isVertical ? 'flex-col' : 'flex-row'
        }`}
      >
        <ToolbarButton
          testId="zoom-in-button"
          label={_({ id: 'canvas.zoom.zoom_in', message: 'Zoom in' })}
          tooltipSide={tooltipSide}
          onClick={handleZoomIn}
          className={ZOOM_ICON_BUTTON_CLASS}
        >
          <ZoomIn />
        </ToolbarButton>

        <ToolbarButton
          testId="zoom-out-button"
          label={_({ id: 'canvas.zoom.zoom_out', message: 'Zoom out' })}
          tooltipSide={tooltipSide}
          onClick={handleZoomOut}
          className={ZOOM_ICON_BUTTON_CLASS}
        >
          <ZoomOut />
        </ToolbarButton>

        <ToolbarButton
          testId="fit-to-view-button"
          label={_({ id: 'canvas.zoom.fit_to_screen', message: 'Fit to screen' })}
          tooltipSide={tooltipSide}
          onClick={handleFitView}
          className={ZOOM_ICON_BUTTON_CLASS}
        >
          <Scan />
        </ToolbarButton>

        {onOrganize && (
          <ToolbarButton
            testId="organize-button"
            label={_({ id: 'canvas.zoom.tidy_up', message: 'Tidy up' })}
            tooltipSide={tooltipSide}
            onClick={onOrganize}
            className={ZOOM_ICON_BUTTON_CLASS}
          >
            <BrushCleaning />
          </ToolbarButton>
        )}
      </div>
    );
  })
);

CanvasZoomControls.displayName = 'CanvasZoomControls';
