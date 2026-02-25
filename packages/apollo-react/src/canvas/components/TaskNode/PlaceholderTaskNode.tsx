/**
 * PlaceholderTaskNode - Visual placeholder rendered as a React Flow node
 * This ensures it appears in the same rendering layer as actual TaskNodes
 */

import { Spacing } from '@uipath/apollo-core';
import type { NodeProps } from '@xyflow/react';

export interface PlaceholderTaskNodeProps extends NodeProps {
  data: {
    isParallel?: boolean;
  };
}

export const PlaceholderTaskNode = ({ data }: PlaceholderTaskNodeProps) => {
  const width = data.isParallel
    ? 'var(--stage-task-width-parallel, 246px)' // Parallel: 272 - 26 = 246px
    : 'var(--stage-task-width, 272px)'; // Sequential: full width 272px

  return (
    <div
      style={{
        width,
        height: 36,
        border: '2px dashed var(--uix-canvas-border-de-emp)',
        borderRadius: Spacing.SpacingXs,
        backgroundColor: 'transparent',
        boxSizing: 'border-box',
      }}
      data-testid="placeholder-task-node"
    />
  );
};
