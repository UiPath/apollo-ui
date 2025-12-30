import { memo, useCallback } from 'react';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { NodeResizeControl, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/portal-shell-react';
import type { GroupNodeData } from './GroupNode.types';
import {
  GroupContainer,
  GroupHeader,
  GroupIconWrapper,
  GroupTitle,
  GroupControls,
  GroupContent,
  ResizeHandle,
  TopCornerIndicators,
  BottomCornerIndicators,
  GroupHeaderButton,
  GroupHeaderSeparator,
} from './GroupNode.styles';
import { GRID_SPACING } from '../../constants';

export interface GroupNodeProps extends NodeProps {
  data: GroupNodeData;
}

const minWidth = GRID_SPACING * 12;
const minHeight = GRID_SPACING * 12;

const GroupNodeComponent = ({ id, data, selected }: GroupNodeProps) => {
  const { updateNodeData } = useReactFlow();

  const title = data.title || 'Group';
  const iconName = data.iconName || 'folder';
  const backgroundColor = data.backgroundColor;
  const borderColor = data.borderColor;
  const collapsed = data.collapsed || false;

  // Toggle collapse/expand
  const handleToggleCollapse = useCallback(() => {
    updateNodeData(id, { collapsed: !collapsed });
  }, [id, collapsed, updateNodeData]);

  return (
    <>
      {/* Top-left resize control */}
      <NodeResizeControl
        style={{ background: 'transparent', border: 'none', zIndex: 100 }}
        position="top-left"
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <ResizeHandle selected={selected} cursor="nwse-resize" />
      </NodeResizeControl>

      {/* Top-right resize control */}
      <NodeResizeControl
        style={{ background: 'transparent', border: 'none', zIndex: 100 }}
        position="top-right"
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <ResizeHandle selected={selected} cursor="nesw-resize" />
      </NodeResizeControl>

      {/* Bottom-left resize control */}
      <NodeResizeControl
        style={{ background: 'transparent', border: 'none', zIndex: 100 }}
        position="bottom-left"
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <ResizeHandle selected={selected} cursor="nesw-resize" />
      </NodeResizeControl>

      {/* Bottom-right resize control */}
      <NodeResizeControl
        style={{ background: 'transparent', border: 'none', zIndex: 100 }}
        position="bottom-right"
        minWidth={minWidth}
        minHeight={minHeight}
      >
        <ResizeHandle selected={selected} cursor="nwse-resize" />
      </NodeResizeControl>

      <GroupContainer
        backgroundColor={backgroundColor}
        borderColor={borderColor}
        selected={selected}
        collapsed={collapsed}
      >
        <TopCornerIndicators selected={selected} />
        <BottomCornerIndicators selected={selected} />
        <GroupHeader>
          <GroupIconWrapper>
            <ApIcon name={iconName} size="16px" />
          </GroupIconWrapper>
          <GroupTitle>{title}</GroupTitle>
          <GroupControls>
            <GroupHeaderSeparator />
            <GroupHeaderButton
              type="button"
              className="nodrag nopan"
              onClick={handleToggleCollapse}
              aria-label={collapsed ? 'Expand group' : 'Collapse group'}
              title={collapsed ? 'Expand group' : 'Collapse group'}
            >
              <ApIcon
                variant="outlined"
                name={collapsed ? 'expand_more' : 'expand_less'}
                size="16px"
              />
            </GroupHeaderButton>
            <GroupHeaderButton
              type="button"
              className="nodrag nopan"
              aria-label="More options"
              title="More options"
            >
              <ApIcon variant="outlined" name="more_vert" size="16px" />
            </GroupHeaderButton>
          </GroupControls>
        </GroupHeader>
        <GroupContent collapsed={collapsed}>
          {/* Child nodes will be rendered here by React Flow's parent-child mechanism */}
        </GroupContent>
      </GroupContainer>
    </>
  );
};

export const GroupNode = memo(GroupNodeComponent);
