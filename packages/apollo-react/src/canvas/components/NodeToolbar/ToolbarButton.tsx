import { ApIcon, ApTooltip } from '@uipath/apollo-react/material/components';
import { memo } from 'react';
import { getLighterColor } from '@uipath/apollo-react/canvas/utils';
import { StyledToolbarButton } from './NodeToolbar.styles';
import type { ToolbarActionItem } from './NodeToolbar.types';

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
  const hoverColor = action.color ? getLighterColor(action.color) : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEnabled) {
      action.onClick();
    }
  };

  return (
    <StyledToolbarButton
      layout={layoutId ? true : undefined}
      layoutId={layoutId}
      transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
      type="button"
      className="nodrag nopan"
      onClick={handleClick}
      aria-label={action.label}
      aria-disabled={!isEnabled}
      aria-pressed={action.isToggled}
      $disabled={!isEnabled}
      $isToggled={action.isToggled}
      $color={action.color}
      $hoverColor={hoverColor}
    >
      <ApTooltip content={action.label} placement="top">
        <>
          {action.icon && typeof action.icon === 'string' && (
            <ApIcon variant="outlined" name={action.icon} size="16px" color={action.color} />
          )}
          {action.icon && typeof action.icon !== 'string' && action.icon}
        </>
      </ApTooltip>
    </StyledToolbarButton>
  );
});

ToolbarButton.displayName = 'ToolbarButton';
