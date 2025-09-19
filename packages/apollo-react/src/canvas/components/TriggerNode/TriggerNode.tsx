import { memo, useMemo, useState, useCallback } from "react";
import { useStore, Position } from "@uipath/uix/xyflow/react";
import { TriggerContainer, TriggerIconWrapper } from "./TriggerNode.styles";
import { StageHandle } from "../StageNode/StageHandle";
import type { TriggerNodeProps } from "./TriggerNode.types";
import { ApTooltip, ApIcon } from "@uipath/portal-shell-react";

const TriggerNodeComponent = (props: TriggerNodeProps) => {
  const { selected, id, details = {} } = props;
  const { tooltip, icon, status } = details;

  const [isHovered, setIsHovered] = useState(false);

  const { hasConnections, isConnecting } = useStore(
    (state) => {
      const hasConnections = state.edges?.some((edge) => edge.source === id || edge.target === id) ?? false;
      return { hasConnections, isConnecting: !!state.connectionClickStartHandle };
    },
    (a, b) => a.hasConnections === b.hasConnections && a.isConnecting === b.isConnecting
  );

  const shouldShowHandles = useMemo(() => {
    return selected || isHovered || isConnecting || hasConnections;
  }, [selected, isHovered, isConnecting, hasConnections]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const triggerContent = (
    <TriggerContainer selected={!!selected} status={status} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <TriggerIconWrapper status={status}>{icon || <ApIcon name="bolt" variant="outlined" size="30px" />}</TriggerIconWrapper>
    </TriggerContainer>
  );

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {tooltip ? (
        <ApTooltip content={tooltip} placement="top" style={{ width: "100%", height: "100%" }}>
          {triggerContent}
        </ApTooltip>
      ) : (
        triggerContent
      )}

      <StageHandle id={id as string} type="source" position={Position.Right} isVisible={!!shouldShowHandles} />
    </div>
  );
};

export const TriggerNode = memo(TriggerNodeComponent);
