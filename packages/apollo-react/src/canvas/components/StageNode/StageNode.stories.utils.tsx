import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import { StageNode } from './StageNode';
import type { StageNodeProps } from './StageNode.types';

export const StageNodeWrapper = memo((props: NodeProps) => {
  return <StageNode {...(props as StageNodeProps)} {...props.data} />;
});
