import { getLighterColor } from '@uipath/apollo-react/canvas/utils';
import { memo, useEffect, useMemo, useRef } from 'react';
import { CanvasIcon } from '../../../utils/icon-registry';
import { CanvasTooltip } from '../../CanvasTooltip';
import { ToolbarIconButton } from './ToolbarIconButton';
import type { ToolbarActionItem } from './toolbar.types';

export interface ExtendedToolbarAction extends ToolbarActionItem {
  onClick: () => void;
  /** `onHoverChange` bound to the toolbar's node. */
  onHover?: (hovered: boolean) => void;
}

/**
 * Props that report an action as hovered while the pointer is over it or it has keyboard
 * focus. An unmount while hovered reports the leave, since a toolbar that closes under the
 * pointer fires no event for it.
 */
export function useActionHover(onHover: ((hovered: boolean) => void) | undefined) {
  const latest = useRef(onHover);
  latest.current = onHover;
  const state = useRef({ pointer: false, focus: false, reported: false });

  useEffect(
    () => () => {
      if (state.current.reported) latest.current?.(false);
      state.current = { pointer: false, focus: false, reported: false };
    },
    []
  );

  const reporting = !!onHover;
  return useMemo(() => {
    if (!reporting) return undefined;
    const set = (change: { pointer?: boolean; focus?: boolean }) => {
      Object.assign(state.current, change);
      const hovered = state.current.pointer || state.current.focus;
      if (hovered === state.current.reported) return;
      state.current.reported = hovered;
      latest.current?.(hovered);
    };
    return {
      onPointerEnter: () => set({ pointer: true }),
      onPointerLeave: () => set({ pointer: false }),
      onFocus: () => set({ focus: true }),
      onBlur: () => set({ focus: false }),
    };
  }, [reporting]);
}

export interface ToolbarButtonProps {
  action: ExtendedToolbarAction;
  /**
   * Used for Framer Motion layout animations.
   * Provide a unique `layoutId` to enable smooth transitions between layout change for this button.
   */
  layoutId?: string;
}

export const ToolbarButton = memo(({ action, layoutId }: ToolbarButtonProps) => {
  const isEnabled = !action.disabled;
  const hoverBg = action.color ? getLighterColor(action.color) : undefined;
  const hoverProps = useActionHover(action.onHover);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEnabled) {
      action.onClick();
    }
  };

  const button = (
    <ToolbarIconButton
      layout={layoutId ? true : undefined}
      layoutId={layoutId}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      type="button"
      className="nodrag nopan"
      onClick={handleClick}
      aria-label={action.label}
      data-testid={action.testId}
      aria-disabled={!isEnabled}
      aria-pressed={action.isToggled}
      disabled={!isEnabled}
      isToggled={action.isToggled}
      color={action.color}
      hoverBg={hoverBg}
      {...(isEnabled ? hoverProps : undefined)}
    >
      {action.icon && typeof action.icon === 'string' ? (
        <CanvasIcon icon={action.icon} size={16} color={action.color} />
      ) : (
        action.icon
      )}
    </ToolbarIconButton>
  );

  return (
    <CanvasTooltip content={action.label} placement="top">
      {isEnabled ? (
        button
      ) : (
        // A disabled button emits no pointer events, so the tooltip trigger has
        // to sit on a wrapper. Without it a disabled action is an unlabelled
        // grey icon, which is exactly when the label matters most.
        <span className="inline-flex" data-testid="toolbar-action-hover-target" {...hoverProps}>
          {button}
        </span>
      )}
    </CanvasTooltip>
  );
});

ToolbarButton.displayName = 'ToolbarButton';
