import { useMemo, useCallback, memo, useState } from "react";
import { Position } from "@xyflow/react";
import { AnimatePresence } from "motion/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { Row } from "@uipath/uix-core";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { canvasEventBus } from "../../utils/CanvasEventBus";
import { StyledAddButton, StyledHandle, StyledLabel, StyledLine, StyledNotch, StyledWrapper } from "./ButtonHandle.styles";

export interface HandleActionEvent {
  handleId: string;
  nodeId: string;
  handleType: "artifact" | "input" | "output";
  position: Position;
  originalEvent: React.MouseEvent;
}

type AddButtonProps = {
  onAction: (event: React.MouseEvent) => void;
};

const AddButton = memo(({ onAction }: AddButtonProps) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onAction(e);
    },
    [onAction]
  );

  return (
    <AnimatePresence>
      <StyledAddButton
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
        whileHover={{ scale: 1.05 }}
        onClick={handleClick}
      >
        <ApIcon name="add" size="14px" />
      </StyledAddButton>
    </AnimatePresence>
  );
});

type ButtonHandleProps = {
  id: string;
  nodeId: string;
  type: "source" | "target";
  position: Position;
  handleType: "artifact" | "input" | "output";
  label?: string;
  labelIcon?: React.ReactNode;
  visible?: boolean;
  showButton?: boolean;
  selected?: boolean;
  color?: string;
  index?: number; // 0-based index of this handle on the edge
  total?: number; // Total number of handles on this edge
  onAction?: (event: HandleActionEvent) => void;
};

const ButtonHandleBase = ({
  id,
  nodeId,
  type,
  position,
  handleType,
  label,
  labelIcon,
  visible = true,
  showButton = true,
  color = "var(--color-border)",
  selected = false,
  index = 0,
  total = 1,
  onAction,
}: ButtonHandleProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isVertical = position === Position.Top || position === Position.Bottom;

  // Calculate position along the edge for multiple handles
  const positionPercent = useMemo(() => ((index + 1) / (total + 1)) * 100, [index, total]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      const actionEvent: HandleActionEvent = {
        handleId: id,
        nodeId,
        handleType,
        position,
        originalEvent: event,
      };

      // Call direct callback first for immediate response
      if (onAction) {
        onAction(actionEvent);
      }

      // Emit to event bus for global listeners
      canvasEventBus.emit("handle:action", {
        handleId: id,
        nodeId,
        handleType,
        position,
        // timestamp: Date.now(), // Optional - uncomment if you need timing info
      });
    },
    [id, nodeId, handleType, position, onAction]
  );

  return (
    <StyledHandle
      type={type}
      position={position}
      id={id}
      isConnectable={handleType !== "artifact"}
      $positionPercent={positionPercent}
      $total={total}
      $visible={visible}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {label && (
        <StyledLabel $position={position}>
          <Row align="center" gap={4}>
            {labelIcon}
            <ApTypography color="var(--color-foreground-de-emp)" variant={FontVariantToken.fontSizeSBold}>
              {label}
            </ApTypography>
          </Row>
        </StyledLabel>
      )}
      {showButton && onAction && type === "source" && (
        <StyledWrapper $position={position}>
          <StyledLine $isVertical={isVertical} $selected={selected} />
          <div className="nodrag nopan" style={{ pointerEvents: "auto" }}>
            <AddButton onAction={handleButtonClick} />
          </div>
        </StyledWrapper>
      )}
      <StyledNotch
        $notchColor={color}
        $handleType={handleType}
        $visible={visible}
        $isVertical={isVertical}
        $selected={selected}
        $hovered={isHovered}
      />
    </StyledHandle>
  );
};

export const ButtonHandle = memo(ButtonHandleBase);

export interface ButtonHandleConfig {
  id: string;
  type: "source" | "target";
  handleType: "artifact" | "input" | "output";
  label?: string;
  labelIcon?: React.ReactNode;
  showButton?: boolean;
  color?: string;
  onAction?: (event: HandleActionEvent) => void;
}

const ButtonHandlesBase = ({
  nodeId,
  handles,
  position,
  selected = false,
  visible = true,
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  selected?: boolean;
  visible?: boolean;
}) => {
  const total = handles.length;

  return (
    <>
      {handles.map((handle, index) => (
        <ButtonHandle
          key={handle.id}
          id={handle.id}
          nodeId={nodeId}
          type={handle.type}
          position={position}
          handleType={handle.handleType}
          label={handle.label}
          labelIcon={handle.labelIcon}
          index={index}
          total={total}
          selected={selected}
          visible={visible}
          showButton={selected && visible && handle.showButton}
          color={handle.color}
          onAction={handle.onAction}
        />
      ))}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
