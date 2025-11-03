import { ApIcon } from "@uipath/portal-shell-react";
import { useStoreApi, type NodeProps } from "@uipath/uix/xyflow/react";
import { useCallback, useRef } from "react";
import { useCanvasStore } from "../../stores/canvasStore";
import { AddNodePanel, type NodeItemData } from "../AddNodePanel";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import { Header, IconWrapper, NodeContainer, TextContainer } from "./BlankCanvasNode.styles";

interface BlankCanvasNodeProps extends NodeProps {
  data: Record<string, unknown>;
}

export const BlankCanvasNode = (props: BlankCanvasNodeProps) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const store = useCanvasStore();
  const storeApi = useStoreApi();
  const { id, selected, positionAbsoluteX, positionAbsoluteY, data } = props;
  const { label } = data;

  const handleClosePanel = useCallback(() => {
    storeApi.getState().resetSelectedElements();
  }, [storeApi]);

  const handleNodeSelect = useCallback(
    (nodeItemData: NodeItemData) => {
      const position = { x: positionAbsoluteX, y: positionAbsoluteY };
      store.removeNode(id);
      store.addNode(nodeItemData.type, position);
    },
    [id, store, positionAbsoluteX, positionAbsoluteY]
  );

  return (
    <>
      <NodeContainer selected={selected} ref={nodeRef}>
        <IconWrapper>
          <ApIcon name="add" size="48px" color="var(--color-foreground-de-emp)" />
        </IconWrapper>
      </NodeContainer>
      {typeof label === "string" && (
        <TextContainer>
          <Header>{label}</Header>
        </TextContainer>
      )}

      <FloatingCanvasPanel open={selected} nodeId={id} placement="right-start" offset={20}>
        <AddNodePanel onNodeSelect={(item) => handleNodeSelect(item.data)} onClose={handleClosePanel} />
      </FloatingCanvasPanel>
    </>
  );
};
