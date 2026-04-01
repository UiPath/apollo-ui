import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { NodeResizeControl, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { memo, useCallback } from 'react';
import { GRID_SPACING } from '../../constants';
import {
  BottomCornerIndicators,
  GroupContainer,
  GroupContent,
  GroupControls,
  GroupHeader,
  GroupHeaderButton,
  GroupHeaderSeparator,
  GroupIconWrapper,
  GroupTitle,
  ResizeHandle,
  TopCornerIndicators,
} from './GroupNode.styles';
import type { GroupNodeData } from './GroupNode.types';
import { useGroupNodeConfig } from './GroupNodeConfigContext';

export interface GroupNodeProps extends NodeProps {
  data: GroupNodeData;
}

const minWidth = GRID_SPACING * 12;
const minHeight = GRID_SPACING * 12;
const COLLAPSED_HEADER_HEIGHT = 64;

const GroupNodeComponent = ({ id, data, selected }: GroupNodeProps) => {
  const { setNodes, setEdges, getNodes } = useReactFlow();
  const { headerActions, executionStatus, onMoreOptions, hideMoreOptions, hideCollapseButton } =
    useGroupNodeConfig();

  const title = data.title || 'Group';
  const iconName = data.iconName;
  const backgroundColor = data.backgroundColor;
  const borderColor = data.borderColor;
  const collapsed = data.collapsed || false;

  // Toggle collapse/expand — hides child nodes, resizes container, hides child edges
  const handleToggleCollapse = useCallback(() => {
    const willCollapse = !collapsed;
    const childNodeIds = new Set(
      getNodes()
        .filter((n) => n.parentId === id)
        .map((n) => n.id)
    );

    if (willCollapse) {
      // Store current height and collapse
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            // NodeResizeControl stores dimensions on node.height (not style.height),
            // so check node.height first, then measured, then style as fallback
            const styleHeight = node.style?.height;
            const parsedStyleHeight =
              typeof styleHeight === 'number'
                ? styleHeight
                : typeof styleHeight === 'string'
                  ? parseFloat(styleHeight) || undefined
                  : undefined;
            const currentHeight =
              node.height ?? node.measured?.height ?? parsedStyleHeight ?? minHeight;
            return {
              ...node,
              height: COLLAPSED_HEADER_HEIGHT,
              style: { ...node.style, height: COLLAPSED_HEADER_HEIGHT },
              data: { ...node.data, collapsed: true, expandedHeight: currentHeight },
            };
          }
          if (childNodeIds.has(node.id)) {
            return { ...node, hidden: true };
          }
          return node;
        })
      );
    } else {
      // Restore height and show children
      const expandedHeight = data.expandedHeight ?? minHeight;
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              height: expandedHeight,
              style: { ...node.style, height: expandedHeight },
              data: { ...node.data, collapsed: false },
            };
          }
          if (childNodeIds.has(node.id)) {
            return { ...node, hidden: false };
          }
          return node;
        })
      );
    }

    // Hide/show edges connected to child nodes
    setEdges((edges) =>
      edges.map((edge) =>
        childNodeIds.has(edge.source) || childNodeIds.has(edge.target)
          ? { ...edge, hidden: willCollapse }
          : edge
      )
    );
  }, [id, collapsed, data.expandedHeight, getNodes, setNodes, setEdges]);

  return (
    <>
      {/* Resize controls — hidden when collapsed */}
      {!collapsed && (
        <>
          <NodeResizeControl
            style={{ background: 'transparent', border: 'none', zIndex: 100 }}
            position="top-left"
            minWidth={minWidth}
            minHeight={minHeight}
          >
            <ResizeHandle selected={selected} cursor="nwse-resize" />
          </NodeResizeControl>

          <NodeResizeControl
            style={{ background: 'transparent', border: 'none', zIndex: 100 }}
            position="top-right"
            minWidth={minWidth}
            minHeight={minHeight}
          >
            <ResizeHandle selected={selected} cursor="nesw-resize" />
          </NodeResizeControl>

          <NodeResizeControl
            style={{ background: 'transparent', border: 'none', zIndex: 100 }}
            position="bottom-left"
            minWidth={minWidth}
            minHeight={minHeight}
          >
            <ResizeHandle selected={selected} cursor="nesw-resize" />
          </NodeResizeControl>

          <NodeResizeControl
            style={{ background: 'transparent', border: 'none', zIndex: 100 }}
            position="bottom-right"
            minWidth={minWidth}
            minHeight={minHeight}
          >
            <ResizeHandle selected={selected} cursor="nwse-resize" />
          </NodeResizeControl>
        </>
      )}

      <GroupContainer
        backgroundColor={backgroundColor}
        borderColor={borderColor}
        selected={selected}
        collapsed={collapsed}
        executionStatus={executionStatus}
      >
        <TopCornerIndicators selected={selected} />
        <BottomCornerIndicators selected={selected} />
        <GroupHeader>
          {iconName && (
            <GroupIconWrapper>
              <ApIcon name={iconName} size="16px" />
            </GroupIconWrapper>
          )}
          <GroupTitle>{title}</GroupTitle>
          <GroupControls>
            {headerActions && (
              <>
                <GroupHeaderSeparator />
                {headerActions}
              </>
            )}
            {!hideCollapseButton && (
              <>
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
              </>
            )}
            {!hideMoreOptions && (
              <GroupHeaderButton
                type="button"
                className="nodrag nopan"
                onClick={onMoreOptions}
                aria-label="More options"
                title="More options"
              >
                <ApIcon variant="outlined" name="more_vert" size="16px" />
              </GroupHeaderButton>
            )}
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
