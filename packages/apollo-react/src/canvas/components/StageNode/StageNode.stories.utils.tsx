import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo } from 'react';
import { StageNode } from './StageNode';
import type { StageNodeBaseProps } from './StageNode.types';

type StageNodeWrapperProps = Omit<NodeProps, 'data'> & {
  data: StageNodeBaseProps;
};

export const StageNodeWrapper = memo(
  ({ id, selected, dragging, width, data }: StageNodeWrapperProps) => {
    return <StageNode id={id} selected={selected} dragging={dragging} width={width} {...data} />;
  }
);
