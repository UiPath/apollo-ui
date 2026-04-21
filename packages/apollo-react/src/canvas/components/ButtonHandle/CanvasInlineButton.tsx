import { Button, cn } from '@uipath/apollo-wind';
import { type ComponentPropsWithoutRef, forwardRef, isValidElement, type ReactNode } from 'react';
import { CanvasIcon } from '../../utils/icon-registry';

/**
 * Canvas inline icon-only button used for small affordances rendered directly
 * next to nodes / edges (e.g. the "+" on node handles or on an edge).
 */
export interface CanvasInlineButtonProps
  extends Omit<ComponentPropsWithoutRef<typeof Button>, 'variant' | 'size' | 'icon' | 'children'> {
  /**
   * Icon to render inside the button. A string is resolved via the canvas icon
   * registry; any other `ReactNode` is rendered as-is.
   */
  icon?: ReactNode;
  /** Icon size in px when `icon` is a registry name string. Ignored for `ReactNode`. */
  iconSize?: number;
}

const CANVAS_INLINE_BUTTON_CLASS =
  'grid place-items-center w-7 h-7 rounded-[10px] ' +
  'border border-(--canvas-border) bg-(--canvas-background-raised) text-(--canvas-foreground) ' +
  'enabled:hover:bg-(--canvas-background-overlay) enabled:hover:border-(--canvas-primary-hover) enabled:hover:text-(--canvas-foreground) ' +
  '[transition:opacity_120ms_ease,color_120ms_ease,background-color_120ms_ease,border-color_120ms_ease]';

export const CanvasInlineButton = forwardRef<HTMLButtonElement, CanvasInlineButtonProps>(
  ({ icon = 'plus', iconSize = 14, className, ...rest }, ref) => {
    const iconNode =
      typeof icon === 'string' ? (
        <CanvasIcon icon={icon} size={iconSize} />
      ) : isValidElement(icon) ? (
        icon
      ) : null;

    return (
      <Button
        ref={ref}
        variant="outline"
        size="3xs"
        icon
        className={cn(CANVAS_INLINE_BUTTON_CLASS, className)}
        {...rest}
      >
        {iconNode}
      </Button>
    );
  }
);

CanvasInlineButton.displayName = 'CanvasInlineButton';
