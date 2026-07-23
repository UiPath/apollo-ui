import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { BrushCleaning, Scan, ZoomIn, ZoomOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment, forwardRef, memo, useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import { CanvasIcon } from '../../utils/icon-registry';
import { ToolbarButton } from '../ToolbarButton';

/** A single choice offered by the "Tidy up" menu, e.g. a layout strategy. */
export interface TidyUpMenuOption {
  id: string;
  label: string;
  disabled?: boolean;
  /**
   * Icon shown next to the label, matching NodeToolbar's overflow-menu
   * format. Pass a canvas icon id string (resolved via the icon registry,
   * e.g. "grid-3x3") or a pre-rendered ReactNode.
   */
  icon?: ReactNode;
  /** Renders a separator above this option, e.g. to set a destructive/reset action apart. */
  separatorBefore?: boolean;
}

export interface CanvasZoomControlsProps {
  orientation?: 'vertical' | 'horizontal';
  fitViewOptions?: { duration?: number; padding?: number; maxZoom?: number };
  zoomInOptions?: { duration?: number };
  zoomOutOptions?: { duration?: number };
  /**
   * Runs a single "Tidy up" action immediately on click. Ignored when
   * `tidyUpOptions` is provided -- pass that instead to offer a choice of
   * strategies via a menu.
   */
  onOrganize?: () => void;
  /**
   * When provided (with at least one option), the "Tidy up" button opens a
   * menu of strategies instead of running a single hardcoded action.
   */
  tidyUpOptions?: TidyUpMenuOption[];
  onTidyUpSelect?: (optionId: string) => void;
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
      tidyUpOptions,
      onTidyUpSelect,
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

        {tidyUpOptions && tidyUpOptions.length > 0 ? (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    data-testid="tidy-up-menu-button"
                    aria-label={_({ id: 'canvas.zoom.tidy_up', message: 'Tidy up' })}
                    variant="ghost"
                    size="xs"
                    icon
                    className={ZOOM_ICON_BUTTON_CLASS}
                  >
                    <BrushCleaning />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>
                {_({ id: 'canvas.zoom.tidy_up', message: 'Tidy up' })}
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" side={tooltipSide} sideOffset={8} className="w-48">
              {tidyUpOptions.map((option) => (
                <Fragment key={option.id}>
                  {option.separatorBefore && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    data-testid={`tidy-up-option-${option.id}`}
                    disabled={option.disabled}
                    onSelect={() => onTidyUpSelect?.(option.id)}
                  >
                    {typeof option.icon === 'string' ? (
                      <CanvasIcon icon={option.icon} size={16} />
                    ) : (
                      option.icon
                    )}
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          onOrganize && (
            <ToolbarButton
              testId="organize-button"
              label={_({ id: 'canvas.zoom.tidy_up', message: 'Tidy up' })}
              tooltipSide={tooltipSide}
              onClick={onOrganize}
              className={ZOOM_ICON_BUTTON_CLASS}
            >
              <BrushCleaning />
            </ToolbarButton>
          )
        )}
      </div>
    );
  })
);

CanvasZoomControls.displayName = 'CanvasZoomControls';
