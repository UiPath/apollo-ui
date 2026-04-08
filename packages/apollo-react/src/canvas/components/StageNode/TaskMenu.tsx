import token, { Spacing } from '@uipath/apollo-core';
import { ApIcon, ApIconButton, ApMenu } from '@uipath/apollo-react/material';
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { type TransformedMenuItem, transformMenuItems } from './StageNodeTaskUtilities';

export interface TaskMenuHandle {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

interface TaskMenuProps {
  taskId: string;
  getContextMenuItems: () => NodeMenuItem[];
  onMenuOpenChange?: (isOpen: boolean) => void;
  taskRef?: React.RefObject<HTMLElement | null>;
}

const TaskMenuComponent = (
  { taskId, getContextMenuItems, onMenuOpenChange, taskRef }: TaskMenuProps,
  ref: React.Ref<TaskMenuHandle>
) => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  const isMenuOpen = anchorElement !== null;

  const [menuItems, setMenuItems] = useState<TransformedMenuItem[]>([]);

  const handleMenuClose = useCallback(() => {
    setAnchorElement(null);
    onMenuOpenChange?.(false);
  }, [onMenuOpenChange]);

  const handleMenuItemClick = useCallback(
    (item: NodeMenuAction) => {
      item.onClick();
      handleMenuClose();
    },
    [handleMenuClose]
  );

  const openMenu = useCallback(
    (anchor: HTMLElement | null) => {
      if (!anchor) {
        return;
      }

      setAnchorElement(anchor);
      setMenuItems(transformMenuItems(getContextMenuItems(), handleMenuItemClick));
      onMenuOpenChange?.(true);
    },
    [getContextMenuItems, handleMenuItemClick, onMenuOpenChange]
  );

  const handleMenuClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (isMenuOpen) {
        handleMenuClose();
      } else {
        openMenu(menuAnchorRef.current);
      }
    },
    [isMenuOpen, handleMenuClose, openMenu]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      e.preventDefault();
      const anchor = taskRef?.current || (e.currentTarget as HTMLElement);
      openMenu(anchor);
    },
    [taskRef, openMenu]
  );

  useImperativeHandle(ref, () => ({
    handleContextMenu,
  }));

  const handleMenuMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

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
        menuItems={menuItems}
        anchorEl={anchorElement}
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
        slotProps={{
          paper: {
            className: 'task-menu-paper',
            sx: {
              '&.task-menu-paper .MuiList-padding': {
                paddingTop: token.Padding.PadL,
                paddingBottom: token.Padding.PadL,
              },
            },
          },
        }}
      />
    </>
  );
};

export const TaskMenu = memo(forwardRef(TaskMenuComponent));
