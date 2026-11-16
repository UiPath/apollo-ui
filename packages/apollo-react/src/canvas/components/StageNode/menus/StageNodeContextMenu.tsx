import { memo, useMemo } from 'react';
import { NodeContextMenu, type NodeMenuItem } from '../../NodeContextMenu';

interface StageNodeContextMenuInnerProps {
  dragging: boolean;
  selected: boolean;
  menuItems?: NodeMenuItem[];
  isHovered: boolean;
}

const StageNodeContextMenuInner = ({
  dragging,
  selected,
  menuItems,
  isHovered,
}: StageNodeContextMenuInnerProps) => {
  // Not gated on `isReadOnly`: these items are host-controlled, so inspection
  // and debug actions stay reachable on a locked stage. The stage's own
  // mutation affordances are gated individually below.
  const shouldShowMenu = useMemo(() => {
    return menuItems && menuItems.length > 0 && (selected || isHovered);
  }, [menuItems, selected, isHovered]);

  if (!menuItems || menuItems.length === 0 || dragging) {
    return null;
  }
  return <NodeContextMenu menuItems={menuItems} isVisible={shouldShowMenu} />;
};

export const StageNodeContextMenu = memo(StageNodeContextMenuInner);
