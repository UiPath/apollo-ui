import { Spacing } from '@uipath/apollo-core';
import { ApIcon, ApIconButton, ApMenu } from '@uipath/apollo-react/material';
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { NodeMenuAction, NodeMenuItem } from '../NodeContextMenu';
import { transformMenuItems } from './StageNodeTaskUtilities';
import token from '@uipath/apollo-core';

export interface TaskMenuHandle {
  handleContextMenu: (e: React.MouseEvent<HTMLElement>) => void;
}

interface TaskMenuProps {
  taskId: string;
  contextMenuItems: NodeMenuItem[];
  onMenuOpenChange?: (isOpen: boolean) => void;
  onMenuOpen?: () => void;
  taskRef?: React.RefObject<HTMLElement | null>;
}

const TaskMenuComponent = (
  { taskId, contextMenuItems, onMenuOpenChange, onMenuOpen, taskRef }: TaskMenuProps,
  ref: React.Ref<TaskMenuHandle>
) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const handleMenuClose = useCallback(() => {
    setIsMenuOpen(false);
    setAnchorElement(null);
    onMenuOpenChange?.(false);
  }, [onMenuOpenChange]);

  const openMenu = useCallback(
    (anchor: HTMLElement | null) => {
      setAnchorElement(anchor);
      setIsMenuOpen(true);
      onMenuOpen?.();
      onMenuOpenChange?.(true);
    },
    [onMenuOpen, onMenuOpenChange]
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
                paddingTop: token.Padding.PadL ,
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
