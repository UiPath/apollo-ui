import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { Handle, Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { memo, useMemo } from 'react';
import { useSafeLingui } from '../../../../i18n';
import { getIcon } from '../../../utils/icon-registry';
import {
  getSeqBarVars,
  INVISIBLE_HANDLE_STYLE,
  SEQ_BAR_SHELL_CLASS,
  SEQUENTIAL_BAR_HANDLE_IDS,
} from '../../BaseNode/BaseNodeBar';
import { BaseInnerShape } from '../../BaseNode/BaseNodeInnerShape';

/**
 * Sequential-view Add Node preview bar. The shared {@link AddNodePreview}
 * centers a `min(w,h)`-sized glyph, which in the 896x56 bar leaves a nearly
 * empty slab with a lonely icon. This mirrors the real bar layout instead: a
 * dashed, de-emphasized bar with the icon box on the LEFT and a "New step"
 * label, so the slot the insert will fill reads like a ghost of a real row.
 *
 * Registered as the `preview` node type only in the sequential view (see
 * SequentialCanvas.tsx); the flow view keeps AddNodePreview. Its handle ids
 * (`input`/`output`) match the Add Node preview edges, offset to the connector
 * spine (SEQ handle offset) so those edges align like a real bar's connectors.
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
        // Match AddNodePreview's selected preview treatment while retaining the
        // horizontal BaseNode bar geometry: raised surface, dashed selection
        // border, normal canvas shadow, and the same 0.8 selected opacity.
        'nodrag border-dashed border-(--canvas-selection-indicator) bg-surface-overlay text-foreground-muted opacity-80',
        'shadow-(--canvas-node-shadow-rest) transition-[box-shadow,border-color] duration-150 hover:shadow-(--canvas-node-shadow-hover)'
      )}
      style={getSeqBarVars(width, height)}
      data-testid="sequential-insert-preview-bar"
    >
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={SEQUENTIAL_BAR_HANDLE_IDS.branchTarget}
        isConnectable={false}
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
      />
      <BaseInnerShape>{icon}</BaseInnerShape>
      <span className="text-sm font-semibold leading-[18px]">{label}</span>
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        isConnectable={false}
        style={INVISIBLE_HANDLE_STYLE}
      />
    </div>
  );
}

export const SequentialInsertPreviewNode = memo(SequentialInsertPreviewNodeComponent);
