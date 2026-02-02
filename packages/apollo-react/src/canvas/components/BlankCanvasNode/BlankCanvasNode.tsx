import { type NodeProps, useStoreApi } from '@uipath/apollo-react/canvas/xyflow/react';
import { ApIcon } from '@uipath/apollo-react/material/components';
import { useCallback, useRef } from 'react';
import { selectAddNode, selectRemoveNode, useCanvasStore } from '../../stores/canvasStore';
import { AddNodePanel, type NodeItemData } from '../AddNodePanel';
import { FloatingCanvasPanel } from '../FloatingCanvasPanel';
import { Header, IconWrapper, NodeContainer, TextContainer } from './BlankCanvasNode.styles';

interface BlankCanvasNodeProps extends NodeProps {
  data: Record<string, unknown>;
}

export const BlankCanvasNode = (props: BlankCanvasNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const removeNode = useCanvasStore(selectRemoveNode);
  const addNode = useCanvasStore(selectAddNode);
  const storeApi = useStoreApi();
  const { id, selected, positionAbsoluteX, positionAbsoluteY, data } = props;
  const { label } = data;

  const handleClosePanel = useCallback(() => {
    storeApi.getState().resetSelectedElements();
  }, [storeApi]);

  const handleNodeSelect = useCallback(
    (nodeItemData: NodeItemData) => {
      const position = { x: positionAbsoluteX, y: positionAbsoluteY };
      removeNode(id);
      addNode(nodeItemData.type, position);
    },
    [id, removeNode, addNode, positionAbsoluteX, positionAbsoluteY]
  );

  return (
    <>
      <NodeContainer selected={selected} ref={nodeRef}>
        <IconWrapper>
          <ApIcon name="add" size="48px" color="var(--uix-canvas-foreground-de-emp)" />
        </IconWrapper>
      </NodeContainer>
      {typeof label === 'string' && (
        <TextContainer>
          <Header>{label}</Header>
        </TextContainer>
      )}

      <FloatingCanvasPanel open={selected} nodeId={id} placement="right-start" offset={20}>
        <AddNodePanel
          onNodeSelect={(item) => handleNodeSelect(item.data as NodeItemData)}
          onClose={handleClosePanel}
        />
      </FloatingCanvasPanel>
    </>
  );
};
