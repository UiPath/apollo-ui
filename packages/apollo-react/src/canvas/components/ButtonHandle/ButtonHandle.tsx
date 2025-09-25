import { useMemo, useCallback, memo, useState } from "react";
import { Position } from "@uipath/uix/xyflow/react";
import { AnimatePresence } from "motion/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { Row } from "@uipath/uix/core";
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
  labelBackgroundColor?: string;
  visible?: boolean;
  showButton?: boolean;
  selected?: boolean;
  color?: string;
  index?: number; // 0-based index of this handle on the edge
  total?: number; // Total number of handles on this edge
  onAction?: (event: HandleActionEvent) => void;
  showNotches?: boolean;
};

const ButtonHandleBase = ({
  id,
  nodeId,
  type,
  position,
  handleType,
  label,
  labelIcon,
  labelBackgroundColor = "var(--color-background-secondary)",
  visible = true,
  showButton = true,
  color = "var(--color-border)",
  selected = false,
  index = 0,
  total = 1,
  onAction,
  showNotches = true,
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
      onAction?.(actionEvent);

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
      onMouseDown={() => setIsHovered(false)}
    >
      {label && (
        <StyledLabel $position={position} $backgroundColor={labelBackgroundColor}>
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
          <StyledLine $isVertical={isVertical} $selected={selected} $size={label ? "60px" : "16px"} />
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
        $showNotch={showNotches}
      />
    </StyledHandle>
  );
};

export const ButtonHandle = memo(ButtonHandleBase);

export interface ButtonHandleConfig {
  /** Is of type string but `ButtonHandleId` should be used for reserved ids */
  id: string;
  type: "source" | "target";
  handleType: "artifact" | "input" | "output";
  label?: string;
  labelIcon?: React.ReactNode;
  showButton?: boolean;
  color?: string;
  labelBackgroundColor?: string;
  visible?: boolean;
  onAction?: (event: HandleActionEvent) => void;
}

const ButtonHandlesBase = ({
  nodeId,
  handles,
  position,
  selected = false,
  visible = true,
  showAddButton = true,
  showNotches = true,
}: {
  nodeId: string;
  handles: ButtonHandleConfig[];
  position: Position;
  selected?: boolean;
  visible?: boolean;
  showAddButton?: boolean;
  showNotches?: boolean;
}) => {
  const total = handles.length;
  const finalSelected = showAddButton && selected;

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
          labelBackgroundColor={handle.labelBackgroundColor}
          index={index}
          total={total}
          selected={selected}
          // Need top level visibility to be true and current handle visibility to be true to keep positioning of handles consistent
          visible={visible && (handle.visible ?? true)}
          showButton={finalSelected && visible && handle.showButton}
          color={handle.color}
          onAction={handle.onAction}
          showNotches={showNotches}
        />
      ))}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
