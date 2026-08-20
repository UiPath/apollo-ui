import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import { EdgeLabelContent } from '../../Edges/shared/primitives';

const BRANCH_HEADER_BOTTOM_GAP = 2;

export interface SequentialBranchHeaderProps {
  x: number;
  targetTopY: number;
  label: string;
  selected?: boolean;
}

/**
 * Introduces a branch with the shared edge-label treatment immediately above
 * its first row. The header is owned by the branch's content area and therefore
 * remains stable when connector routes change.
 */
export function SequentialBranchHeader({
  x,
  targetTopY,
  label,
  selected,
}: SequentialBranchHeaderProps) {
  const anchorY = targetTopY - BRANCH_HEADER_BOTTOM_GAP;

  return (
    <EdgeLabelRenderer>
      <div
        data-testid="sequential-branch-header"
        className="nodrag nopan pointer-events-none absolute top-0 left-0 z-1001"
        style={{ transform: `translate(${x}px, ${anchorY}px) translateY(-100%)` }}
      >
        <EdgeLabelContent text={label} selected={selected} />
      </div>
    </EdgeLabelRenderer>
  );
}
