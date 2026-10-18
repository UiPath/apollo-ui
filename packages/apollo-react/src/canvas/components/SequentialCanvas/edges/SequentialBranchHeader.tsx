import { memo, useMemo } from 'react';
import { EdgeLabelContent } from '../../Edges/shared/primitives';

const BRANCH_HEADER_BOTTOM_GAP = 2;

export interface SequentialBranchHeaderProps {
  x: number;
  targetTopY: number;
  label: string;
  selected?: boolean;
}

/**
 * Branch label rendered immediately above the lane's first row, inside the canvas-level
 * SequentialInsertLayer portal. The wrapper is click-through; only the pill takes pointer
 * events, for its truncation tooltip.
 */
export const SequentialBranchHeader = memo(function SequentialBranchHeader({
  x,
  targetTopY,
  label,
  selected,
}: SequentialBranchHeaderProps) {
  const anchorY = targetTopY - BRANCH_HEADER_BOTTOM_GAP;
  const style = useMemo(
    () => ({ transform: `translate(${x}px, ${anchorY}px) translateY(-100%)` }),
    [x, anchorY]
  );

  return (
    <div
      data-testid="sequential-branch-header"
      className="nodrag nopan pointer-events-none absolute top-0 left-0 z-1001"
      style={style}
    >
      <EdgeLabelContent text={label} selected={selected} tooltip />
    </div>
  );
});
