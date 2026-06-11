import { memo, useMemo } from 'react';
import { CanvasEdge } from './CanvasEdge';
import { areEdgePropsEqual } from './shared/areEdgePropsEqual';
import type { CanvasEdgeData, CanvasEdgeProps } from './shared/types';

/** Legacy SequenceEdge data contract, translated to `CanvasEdgeData` below. */
type LegacySequenceEdgeData = CanvasEdgeData & {
  /** @deprecated Use `enableToolbar: false` instead. */
  hideToolbar?: boolean;
};

/**
 * Workflow edge preset — `CanvasEdge` with `routing: 'handle'`, execution and
 * toolbar enabled by default. Consumer-supplied `data` overrides any default.
 * Prefer `CanvasEdge` directly for new code; kept for backward compatibility
 * with existing `type: 'sequence'` registrations.
 */
export const SequenceEdge = memo(function SequenceEdge(props: CanvasEdgeProps) {
  const data = useMemo<CanvasEdgeData>(() => {
    const { hideToolbar, ...rest } = (props.data ?? {}) as LegacySequenceEdgeData;
    return {
      routing: 'handle',
      enableExecution: true,
      enableToolbar: hideToolbar !== true,
      ...rest,
    };
  }, [props.data]);

  return <CanvasEdge {...props} data={data} />;
}, areEdgePropsEqual);
