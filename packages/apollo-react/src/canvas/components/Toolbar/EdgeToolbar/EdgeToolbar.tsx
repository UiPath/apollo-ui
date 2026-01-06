import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import { AnimatePresence } from 'motion/react';
import { memo, useMemo } from 'react';
import type { ExtendedToolbarAction } from '../shared';
import { ToolbarButton } from '../shared';
import { StyledEdgeToolbarContainer, StyledEdgeToolbarContent } from './EdgeToolbar.styles';
import type { EdgeToolbarProps } from './EdgeToolbar.types';

const EdgeToolbarComponent = ({
  edgeId,
  visible,
  positioning,
  config,
  onMouseEnter,
  onMouseLeave,
}: EdgeToolbarProps) => {
  // Convert EdgeToolbarActionItem to ExtendedToolbarAction for ToolbarButton
  const actionsWithHandlers = useMemo(
    () =>
      config.actions.map((action) => ({
        ...action,
        onClick: () => action.onAction(edgeId, positioning.pathPosition),
      })),
    [config.actions, edgeId, positioning.pathPosition]
  );

  const transform = useMemo(
    () =>
      `translate(-50%, -50%) translate(${positioning.offsetPosition.x}px, ${positioning.offsetPosition.y}px)`,
    [positioning.offsetPosition]
  );

  return (
    <EdgeLabelRenderer>
      <AnimatePresence>
        {visible && (
          <StyledEdgeToolbarContainer
            key={`edge-toolbar-${edgeId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transform }}
            className="nodrag nopan"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <StyledEdgeToolbarContent>
              {actionsWithHandlers.map((action) => (
                <ToolbarButton key={action.id} action={action as ExtendedToolbarAction} />
              ))}
            </StyledEdgeToolbarContent>
          </StyledEdgeToolbarContainer>
        )}
      </AnimatePresence>
    </EdgeLabelRenderer>
  );
};

EdgeToolbarComponent.displayName = 'EdgeToolbar';

export const EdgeToolbar = memo(EdgeToolbarComponent);
