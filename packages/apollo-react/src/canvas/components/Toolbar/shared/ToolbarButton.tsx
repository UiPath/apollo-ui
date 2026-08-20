import { getLighterColor } from '@uipath/apollo-react/canvas/utils';
import { memo } from 'react';
import { CanvasIcon } from '../../../utils/icon-registry';
import { CanvasTooltip } from '../../CanvasTooltip';
import { ToolbarIconButton } from './ToolbarIconButton';
import type { ToolbarActionItem } from './toolbar.types';

export interface ExtendedToolbarAction extends ToolbarActionItem {
  onClick: () => void;
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
      aria-disabled={!isEnabled}
      aria-pressed={action.isToggled}
      disabled={!isEnabled}
      isToggled={action.isToggled}
      color={action.color}
      hoverBg={hoverBg}
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
        <span className="inline-flex" data-testid="toolbar-action-hover-target">
          {button}
        </span>
      )}
    </CanvasTooltip>
  );
});

ToolbarButton.displayName = 'ToolbarButton';
