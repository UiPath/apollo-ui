import { useCallback, useRef } from "react";
import { useStoreApi, type NodeProps } from "@xyflow/react";
import { ApIcon } from "@uipath/portal-shell-react";
import { FloatingCanvasPanel } from "../FloatingCanvasPanel";
import { AddNodePanel } from "../AddNodePanel";
import { useCanvasStore } from "../../stores/canvasStore";
import type { NodeOption } from "../AddNodePanel/AddNodePanel.types";
import { NodeContainer, IconWrapper, TextContainer, Header } from "./BlankCanvasNode.styles";

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
    (nodeOption: NodeOption) => {
      const position = { x: positionAbsoluteX, y: positionAbsoluteY };
      store.removeNode(id);
      store.addNode(nodeOption.type, position);
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
        <AddNodePanel onNodeSelect={handleNodeSelect} onClose={handleClosePanel} />
      </FloatingCanvasPanel>
    </>
  );
};
