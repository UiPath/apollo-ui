import styled from "@emotion/styled";
import { getResourceNodeBoundaryIconPosition } from "../../../utils/auto-layout";

type NodeBoundaryIcon = {
  render?: () => React.ReactNode;
  component?: React.ReactNode;
  onClick?: () => void;
  visible?: boolean;
};

interface NodeBoundaryIconsContainerProps {
  /**
   * Size (diameter) of the icon with spacing/padding included (not the actual icon size
   *
   * The actual icon will be on `NodeBoundaryIcon.component` or `NodeBoundaryIcon.render`)
   * */
  iconSize: number;
  /** Size (diameter) of the node */
  nodeSize: number;
  bottomLeft?: NodeBoundaryIcon;
  bottomRight?: NodeBoundaryIcon;
  topLeft?: NodeBoundaryIcon;
  topRight?: NodeBoundaryIcon;
}

const NodeIconContainer = styled.div<{
  $position: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  $iconSize: number;
  $nodeSize: number;
}>`
  position: absolute;
  top: ${(props) => getResourceNodeBoundaryIconPosition(props.$position).top(props.$nodeSize / 2, props.$iconSize / 2)}px;
  left: ${(props) => getResourceNodeBoundaryIconPosition(props.$position).left(props.$nodeSize / 2, props.$iconSize / 2)}px;
  z-index: 2;
  background-color: var(--color-background);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${(props) => props.$iconSize}px;
  height: ${(props) => props.$iconSize}px;
`;

export const NodeBoundaryIconsContainer = ({
  iconSize,
  nodeSize,
  bottomLeft,
  bottomRight,
  topLeft,
  topRight,
}: NodeBoundaryIconsContainerProps) => {
  return (
    <>
      {Boolean(bottomLeft?.visible) && (
        <NodeIconContainer $position="bottom-left" $iconSize={iconSize} $nodeSize={nodeSize} onClick={bottomLeft?.onClick}>
          {bottomLeft?.render ? bottomLeft.render() : (bottomLeft?.component ?? null)}
        </NodeIconContainer>
      )}
      {Boolean(bottomRight?.visible) && (
        <NodeIconContainer $position="bottom-right" $iconSize={iconSize} $nodeSize={nodeSize} onClick={bottomRight?.onClick}>
          {bottomRight?.render ? bottomRight.render() : (bottomRight?.component ?? null)}
        </NodeIconContainer>
      )}
      {Boolean(topLeft?.visible) && (
        <NodeIconContainer $position="top-left" $iconSize={iconSize} $nodeSize={nodeSize} onClick={topLeft?.onClick}>
          {topLeft?.render ? topLeft.render() : (topLeft?.component ?? null)}
        </NodeIconContainer>
      )}
      {Boolean(topRight?.visible) && (
        <NodeIconContainer $position="top-right" $iconSize={iconSize} $nodeSize={nodeSize} onClick={topRight?.onClick}>
          {topRight?.render ? topRight.render() : (topRight?.component ?? null)}
        </NodeIconContainer>
      )}
    </>
  );
};
