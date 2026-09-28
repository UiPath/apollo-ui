import { cn } from '@uipath/apollo-wind';
import { type HTMLMotionProps, motion } from 'motion/react';
import { forwardRef, type Ref } from 'react';

/**
 * Base button primitive used by every toolbar (node toolbar actions + overflow
 * ellipsis button + edge toolbar). 24×24 hit target, 16×16 icon that grows to
 * 18×18 on hover, and a background/color that tracks toggled + optional custom
 * action colors via CSS custom properties so Tailwind hover variants can pick
 * them up without inline `:hover` styles.
 */
const TOOLBAR_ICON_BUTTON_CLASS =
  'grid place-items-center w-6 h-6 p-0 border-0 rounded-[4px] ' +
  '[transition:background-color_140ms_ease,color_140ms_ease,opacity_140ms_ease] ' +
  '[&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-[inherit] ' +
  '[&>svg]:origin-center [&>svg]:transition-transform [&>svg]:duration-[140ms] [&>svg]:ease-[ease] ' +
  'text-(--tb-color) bg-(--tb-bg) ' +
  'enabled:hover:bg-(--tb-hover-bg) enabled:hover:text-(--tb-hover-color) ' +
  'enabled:hover:[&>svg]:scale-[1.125]';

const TOOLBAR_ICON_BUTTON_DISABLED_CLASS = 'cursor-not-allowed opacity-40 pointer-events-none';
const TOOLBAR_ICON_BUTTON_ENABLED_CLASS = 'cursor-pointer opacity-100';

export interface ToolbarIconButtonProps extends HTMLMotionProps<'button'> {
  /** Overrides the default rest/hover foreground (icon) color. */
  color?: string;
  /**
   * Overrides the hover background color (and the rest background when
   * `isToggled`). Falls back to `--canvas-background-hover`.
   */
  hoverBg?: string;
  /** When true, the button renders in its "pressed-in" background color at rest. */
  isToggled?: boolean;
}

const ToolbarIconButtonInner = (
  { disabled, isToggled, color, hoverBg, className, style, ...rest }: ToolbarIconButtonProps,
  ref: Ref<HTMLButtonElement>
) => {
  const restColor =
    color ?? (isToggled ? 'var(--canvas-foreground)' : 'var(--canvas-foreground-de-emp)');
  // Actions with a custom `color` keep that color on hover; the default
  // untinted button brightens to `--canvas-foreground` on hover.
  const effectiveHoverColor = color ?? 'var(--canvas-foreground)';
  const restBg = isToggled ? (hoverBg ?? 'var(--canvas-background-hover)') : 'transparent';
  const effectiveHoverBg = hoverBg ?? 'var(--canvas-background-hover)';

  const mergedStyle = {
    ['--tb-color' as string]: restColor,
    ['--tb-hover-color' as string]: effectiveHoverColor,
    ['--tb-bg' as string]: restBg,
    ['--tb-hover-bg' as string]: effectiveHoverBg,
    ...style,
  } as HTMLMotionProps<'button'>['style'];

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      className={cn(
        TOOLBAR_ICON_BUTTON_CLASS,
        disabled ? TOOLBAR_ICON_BUTTON_DISABLED_CLASS : TOOLBAR_ICON_BUTTON_ENABLED_CLASS,
        className
      )}
      style={mergedStyle}
      {...rest}
    />
  );
};

export const ToolbarIconButton = forwardRef(ToolbarIconButtonInner);
ToolbarIconButton.displayName = 'ToolbarIconButton';
