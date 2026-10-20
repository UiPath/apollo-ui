import { useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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

export interface CanvasZoomControlsLabels {
  zoomIn?: string;
  zoomOut?: string;
  fitView?: string;
  organize?: string;
}

/** A single choice offered by the "Tidy up" menu, e.g. a layout strategy the host runs. */
export interface TidyUpMenuOption {
  id: string;
  label: string;
  disabled?: boolean;
  /**
   * Icon shown next to the label. Pass a canvas icon id (resolved via the icon
   * registry, e.g. "layout-grid") or a pre-rendered ReactNode.
   */
  icon?: ReactNode;
  /** Display-only shortcut hint, e.g. "⌘⇧L". The host owns the key binding. */
  shortcut?: string;
  /** Renders a separator above this option, e.g. to set a reset action apart. */
  separatorBefore?: boolean;
}

export interface CanvasZoomControlsProps {
  orientation?: 'vertical' | 'horizontal';
  fitViewOptions?: { duration?: number; padding?: number; maxZoom?: number };
  zoomInOptions?: { duration?: number };
  zoomOutOptions?: { duration?: number };
  /**
   * Runs a single "Tidy up" action on click. Ignored when `tidyUpOptions` is
   * provided.
   */
  onOrganize?: () => void;
  /**
   * When provided (with at least one option), the "Tidy up" button opens a
   * menu of strategies instead of running a single action. The host runs the
   * chosen strategy in `onTidyUpSelect`.
   */
  tidyUpOptions?: TidyUpMenuOption[];
  onTidyUpSelect?: (optionId: string) => void;
  onFitView?: () => void;
  /**
   * Optional label overrides. When omitted, each label falls back to the
   * component's built-in localized string.
   */
  labels?: CanvasZoomControlsLabels;
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
      labels,
    },
    ref
  ) {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { _ } = useSafeLingui();
    const isVertical = orientation === 'vertical';
    const tooltipSide = isVertical ? 'left' : ('top' as const);
    const tidyUpLabel = labels?.organize ?? _({ id: 'canvas.zoom.tidy_up', message: 'Tidy up' });

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
          label={labels?.zoomIn ?? _({ id: 'canvas.zoom.zoom_in', message: 'Zoom in' })}
          tooltipSide={tooltipSide}
          onClick={handleZoomIn}
          className={ZOOM_ICON_BUTTON_CLASS}
        >
          <ZoomIn />
        </ToolbarButton>

        <ToolbarButton
          testId="zoom-out-button"
          label={labels?.zoomOut ?? _({ id: 'canvas.zoom.zoom_out', message: 'Zoom out' })}
          tooltipSide={tooltipSide}
          onClick={handleZoomOut}
          className={ZOOM_ICON_BUTTON_CLASS}
        >
          <ZoomOut />
        </ToolbarButton>

        <ToolbarButton
          testId="fit-to-view-button"
          label={
            labels?.fitView ?? _({ id: 'canvas.zoom.fit_to_screen', message: 'Fit to screen' })
          }
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
                    aria-label={tidyUpLabel}
                    variant="ghost"
                    size="xs"
                    icon
                    className={ZOOM_ICON_BUTTON_CLASS}
                  >
                    <BrushCleaning />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side={tooltipSide}>{tidyUpLabel}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" side={tooltipSide} sideOffset={8} className="min-w-48">
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
                    {option.shortcut && (
                      <DropdownMenuShortcut className="pl-6">
                        {option.shortcut}
                      </DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          onOrganize && (
            <ToolbarButton
              testId="organize-button"
              label={tidyUpLabel}
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
