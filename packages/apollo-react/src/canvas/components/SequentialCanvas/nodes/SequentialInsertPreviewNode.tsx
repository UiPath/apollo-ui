import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useMemo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { DEFAULT_SOURCE_HANDLE_ID, DEFAULT_TARGET_HANDLE_ID } from '../../../constants';
import { getIcon } from '../../../utils/icon-registry';
import {
  getSeqBarVars,
  INVISIBLE_BRANCH_HANDLE_STYLE,
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
import { BaseInnerShape } from '../../BaseNode/BaseNodeInnerShape';

/**
 * Sequential-view Add Node preview: a dashed ghost bar with the icon box on the
 * left, instead of AddNodePreview's centered glyph. Registered as the `preview`
 * type only in sequential view. Its handle ids are the defaults the preview edges use.
 */
function SequentialInsertPreviewNodeComponent({ width, height }: NodeProps) {
  const { _ } = useSafeLingui();
  const label = _({ id: 'sequential-canvas.new-step', message: 'New step' });
  const icon = useMemo(() => {
    const IconComponent = getIcon('square-dashed');
    return <IconComponent />;
  }, []);

  return (
    <div
      className={cn(
        SEQ_BAR_SHELL_CLASS,
        // AddNodePreview's selected treatment on the bar geometry.
        'nodrag border-dashed border-(--canvas-selection-indicator) bg-surface-overlay text-foreground-muted opacity-80',
        'shadow-(--canvas-node-shadow-rest) transition-[box-shadow,border-color] duration-150 hover:shadow-(--canvas-node-shadow-hover)'
      )}
      style={getSeqBarVars(width, height)}
      data-testid="sequential-insert-preview-bar"
    >
      <Handle
        type="target"
        position={Position.Top}
        id={DEFAULT_TARGET_HANDLE_ID}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={INVISIBLE_BRANCH_HANDLE_STYLE}
      />
      <BaseInnerShape>{icon}</BaseInnerShape>
      <span className="text-sm font-semibold leading-[18px]">{label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        id={DEFAULT_SOURCE_HANDLE_ID}
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
    </div>
  );
}

export const SequentialInsertPreviewNode = memo(SequentialInsertPreviewNodeComponent);
