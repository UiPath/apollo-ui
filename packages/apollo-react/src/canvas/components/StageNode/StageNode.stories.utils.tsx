import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import type { NodeMenuItem } from '../NodeContextMenu';
import { StageNode } from './StageNode';
import type { StageNodeBaseProps } from './StageNode.types';

type StageNodeWrapperProps = Omit<NodeProps, 'data'> & {
  data: StageNodeBaseProps;
};

// Hoisted so the prop keeps a stable identity across renders — an inline array
// would defeat StageNode's memo comparator on every wrapper render.
const MENU_ITEMS: NodeMenuItem[] = [
  {
    id: 'menu-item-1',
    label: 'Menu Item 1',
    onClick: () => alert('Menu Item 1 clicked'),
  },
  {
    id: 'menu-item-2',
    label: 'Menu Item 2',
    onClick: () => alert('Menu Item 2 clicked'),
  },
];

// XYFlow passes positionAbsoluteX/Y to the registered node component, which change
// every frame while dragging — compare with the position-ignoring comparator so the
// wrapper (and everything under it) stays quiet during drags.
export const StageNodeWrapper = memo(
  ({ id, selected, dragging, width, data }: StageNodeWrapperProps) => {
    return (
      <StageNode
        id={id}
        selected={selected}
        dragging={dragging}
        width={width}
        {...data}
        menuItems={MENU_ITEMS}
      />
    );
  },
  areNodePropsEqualIgnoringPosition
);
