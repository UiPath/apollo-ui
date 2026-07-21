import type { Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { Button, cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { CanvasIcon } from '../../../utils/icon-registry';
import { useBaseCanvasMode } from '../../BaseCanvas/BaseCanvasModeProvider';
import {
  getSeqBarVars,
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
import { BaseInnerShape } from '../../BaseNode/BaseNodeInnerShape';

export interface SequentialStartNodeData extends Record<string, unknown> {
  /** Invoked by the "Add trigger" button. Injected view-side by the canvas. */
  onAddTrigger?: () => void;
}

/**
 * Synthetic first row of the sequential view. A bar-sized shell with a play icon
 * and a right-aligned "Add trigger" call to action. It carries only a bottom
 * source handle (nothing precedes the start). This node is injected view-only
 * and filtered out of the change callbacks by the canvas assembly.
 */
function SequentialStartNodeComponent({
  data,
  width,
  height,
}: NodeProps<Node<SequentialStartNodeData>>) {
  const { _ } = useSafeLingui();
  const onAddTrigger = data?.onAddTrigger;
  const isDesignMode = useBaseCanvasMode().mode === 'design';

  return (
    <div
      className={cn(SEQ_BAR_SHELL_CLASS, 'cursor-default')}
      style={getSeqBarVars(width, height)}
      data-testid="sequential-start-bar"
    >
      <div className="shrink-0">
        <BaseInnerShape>
          <CanvasIcon icon="play" size={20} />
        </BaseInnerShape>
      </div>

      <span className="flex-1 min-w-0 truncate text-sm font-semibold leading-[18px] text-foreground">
        {_({ id: 'sequential-canvas.start.title', message: 'Workflow start' })}
      </span>

      {isDesignMode && onAddTrigger && (
        <Button
          variant="secondary"
          size="sm"
          className="nodrag ml-auto shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onAddTrigger();
          }}
        >
          {_({ id: 'sequential-canvas.start.add-trigger', message: 'Add trigger' })}
        </Button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        id={SEQUENTIAL_BAR_HANDLE_IDS.source}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
    </div>
  );
}

export const SequentialStartNode = memo(SequentialStartNodeComponent);
