import { useMemo, useCallback, memo } from "react";
import { Position } from "@xyflow/react";
import { AnimatePresence } from "motion/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { LabelContent, StyledAddButton, StyledHandle, StyledLabel, StyledLine, StyledNotch, StyledWrapper } from "./ButtonHandle.styles";

type Props = {
  onClick: (event: React.MouseEvent) => void;
};

const AddButton = memo(({ onClick }: Props) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick(e);
    },
    [onClick]
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
  onClick?: (event: React.MouseEvent) => void;
};

const ButtonHandleBase = ({
  id,
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
  onClick,
}: ButtonHandleProps) => {
  const isVertical = position === Position.Top || position === Position.Bottom;

  // Calculate position along the edge for multiple handles
  const positionPercent = useMemo(() => ((index + 1) / (total + 1)) * 100, [index, total]);

  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      if (onClick) {
        // Attach handleId to the existing event to avoid cloning SyntheticEvent
        (event as unknown as { handleId?: string }).handleId = id;
        onClick(event);
      }
    },
    [id, onClick]
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
    >
      {label && (
        <StyledLabel $position={position}>
          <LabelContent>
            {labelIcon}
            <ApTypography color="var(--color-foreground-de-emp)" variant={FontVariantToken.fontSizeSBold}>
              {label}
            </ApTypography>
          </LabelContent>
        </StyledLabel>
      )}
      {showButton && onClick && (
        <StyledWrapper $position={position}>
          <StyledLine $isVertical={isVertical} $selected={selected} />
          <div className="nodrag nopan" style={{ pointerEvents: "auto" }}>
            <AddButton onClick={handleButtonClick} />
          </div>
        </StyledWrapper>
      )}
      <StyledNotch $notchColor={color} $handleType={handleType} $visible={visible} $isVertical={isVertical} $selected={selected} />
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
  onClick?: (event: React.MouseEvent) => void;
}

const ButtonHandlesBase = ({
  handles,
  position,
  selected = false,
  visible = true,
}: {
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
          onClick={handle.onClick}
        />
      ))}
    </>
  );
};

export const ButtonHandles = memo(ButtonHandlesBase);
