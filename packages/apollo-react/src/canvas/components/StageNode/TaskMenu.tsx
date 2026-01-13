import { Spacing } from '@uipath/apollo-core';
import { ApIcon, ApIconButton, ApMenu } from '@uipath/apollo-react/material';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { transformMenuItems } from './StageNodeTaskUtilities';

interface TaskMenuProps {
  taskId: string;
  contextMenuItems: NodeMenuItem[];
  onMenuOpenChange?: (isOpen: boolean) => void;
}

const TaskMenuComponent = ({ taskId, contextMenuItems, onMenuOpenChange }: TaskMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    onMenuOpenChange?.(false);
  }, [onMenuOpenChange]);

  const handleMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsMenuOpen((open) => {
        const newState = !open;
        onMenuOpenChange?.(newState);
        return newState;
      });
    },
    [onMenuOpenChange]
  );

  const handleMenuMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleMenuItemClick = useCallback(
    (item: NodeMenuAction) => {
      item.onClick();
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const transformedMenuItems = useMemo(() => {
    return transformMenuItems(contextMenuItems, handleMenuItemClick);
  }, [contextMenuItems, handleMenuItemClick]);

  return (
    <>
      <ApIconButton
        ref={menuAnchorRef}
        data-testid={`stage-task-menu-${taskId}`}
        onClick={handleMenuClick}
        onMouseDown={handleMenuMouseDown}
        className="task-menu-icon-button"
        sx={{
          color: 'var(--colorIconDefault) !important',
          minWidth: 'unset !important',
          width: `${Spacing.SpacingL} !important`,
          height: `${Spacing.SpacingL} !important`,
          padding: '0 !important',
        }}
      >
        <ApIcon name="more_vert" size="16px" />
      </ApIconButton>
      <ApMenu
        isOpen={isMenuOpen}
        menuItems={transformedMenuItems}
        anchorEl={menuAnchorRef.current}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        width={300}
      />
    </>
  );
};

export const TaskMenu = memo(TaskMenuComponent);
