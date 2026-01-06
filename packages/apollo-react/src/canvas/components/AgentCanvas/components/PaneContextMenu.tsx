import styled from '@emotion/styled';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useCallback, useEffect, useRef } from 'react';

const MenuContainer = styled(motion.div)<{ $x: number; $y: number }>`
  position: fixed;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  min-width: 180px;
  background: var(--uix-canvas-background);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 6px 0px;
  z-index: 10000;
  pointer-events: auto;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
  font-size: 12px;
  font-weight: 400;
  color: var(--uix-canvas-foreground-de-emp);
  text-align: left;

  &:hover {
    background: var(--uix-canvas-background-secondary);
  }
`;

export interface PaneContextMenuItem {
  label: string;
  onClick: () => void;
}

export interface PaneContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: PaneContextMenuItem[];
  onClose: () => void;
}

export const PaneContextMenu = memo(
  ({ isOpen, position, items, onClose }: PaneContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          onClose();
        }
      };

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      // Use a small delay to avoid closing immediately from the same click that opened the menu
      const timeoutId = setTimeout(() => {
        // Use 'click' instead of 'mousedown' to ensure onClick handlers fire first
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen, onClose]);

    const handleItemClick = useCallback(
      (item: PaneContextMenuItem) => {
        item.onClick();
        onClose();
      },
      [onClose]
    );

    // Don't render if no menu items available
    if (items.length === 0) {
      return null;
    }

    return (
      <AnimatePresence>
        {isOpen && (
          <MenuContainer
            ref={menuRef}
            $x={position.x}
            $y={position.y}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          >
            {items.map((item) => (
              <MenuItem key={item.label} onClick={() => handleItemClick(item)}>
                {item.label}
              </MenuItem>
            ))}
          </MenuContainer>
        )}
      </AnimatePresence>
    );
  }
);

PaneContextMenu.displayName = 'PaneContextMenu';
