import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import { AnimatePresence, motion } from 'motion/react';
import { memo, useMemo } from 'react';
import { CanvasInlineButton } from '../../ButtonHandle/CanvasInlineButton';
import type { EdgeToolbarProps } from './EdgeToolbar.types';

const EdgeToolbarComponent = ({
  edgeId,
  visible,
  positioning,
  config,
  layout = 'row',
  onMouseEnter,
  onMouseLeave,
}: EdgeToolbarProps) => {
  const transform = useMemo(
    () =>
      `translate(-50%, -50%) translate(${positioning.offsetPosition.x}px, ${positioning.offsetPosition.y}px)`,
    [positioning.offsetPosition]
  );

  // The toolbar sits beside the path, offset along its normal. Laying the buttons out along the
  // path keeps a multi-button toolbar from growing back across the edge on vertical runs.
  const besideVerticalRun =
    layout === 'along-path' &&
    Math.abs(positioning.offsetPosition.x - positioning.pathPosition.x) >
      Math.abs(positioning.offsetPosition.y - positioning.pathPosition.y);

  return (
    <EdgeLabelRenderer>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={`edge-toolbar-${edgeId}`}
            className={`nodrag nopan absolute top-0 left-0 z-1004 pointer-events-auto flex items-center gap-1 ${
              besideVerticalRun ? 'flex-col' : 'flex-row'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transform }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {config.actions.map((action) => (
              <CanvasInlineButton
                key={action.id}
                aria-label={action.label ?? action.id}
                disabled={action.disabled}
                icon={action.icon ?? 'plus'}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (!action.disabled) {
                    action.onAction(edgeId, positioning.pathPosition);
                  }
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </EdgeLabelRenderer>
  );
};

EdgeToolbarComponent.displayName = 'EdgeToolbar';

export const EdgeToolbar = memo(EdgeToolbarComponent);
