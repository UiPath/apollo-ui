import type { CSSProperties } from "react";
import { forwardRef, useRef } from "react";
import { Handle, Position } from "@xyflow/react";
import { AnimatePresence, motion } from "motion/react";
import { FontVariantToken } from "@uipath/apollo-core";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";

type Props = {
  onClick: (event: React.MouseEvent) => void;
};

const AddButton = forwardRef<HTMLDivElement, Props>(({ onClick }, ref) => {
  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.25 }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          background: "var(--color-background)",
          color: "var(--color-foreground-emp)",
          borderRadius: "50%",
          border: "1px solid var(--color-border-de-emp)",
          cursor: "pointer",
          transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
        }}
        whileHover={{
          scale: 1.05,
        }}
        onHoverStart={() => {
          if (ref && "current" in ref && ref.current) {
            const element = ref.current;
            element.style.backgroundColor = "var(--color-selection-indicator)";
            element.style.color = "var(--color-background)";
            element.style.borderColor = "var(--color-selection-indicator)";
          }
        }}
        onHoverEnd={() => {
          if (ref && "current" in ref && ref.current) {
            const element = ref.current;
            element.style.backgroundColor = "var(--color-background)";
            element.style.color = "var(--color-foreground)";
            element.style.borderColor = "var(--color-border-de-emp)";
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
      >
        <ApIcon name="add" size="14px" />
      </motion.div>
    </AnimatePresence>
  );
});

const getWrapperPositionStyles = (position: Position): CSSProperties => {
  const baseStyles: CSSProperties = {
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  };

  switch (position) {
    case Position.Top: {
      return {
        ...baseStyles,
        flexDirection: "column-reverse",
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
    case Position.Bottom: {
      return {
        ...baseStyles,
        flexDirection: "column",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
    case Position.Left: {
      return {
        ...baseStyles,
        flexDirection: "row-reverse",
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
      };
    }
    case Position.Right: {
      return {
        ...baseStyles,
        flexDirection: "row",
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
      };
    }
    default: {
      return {
        ...baseStyles,
        flexDirection: "column",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
  }
};

const getLineStyles = (isVertical: boolean, selected: boolean): CSSProperties => {
  const color = selected ? "var(--color-selection-indicator)" : "var(--color-border-de-emp)";

  return {
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderWidth: "1px",
    borderColor: color,
    height: isVertical ? "60px" : "1px",
    width: isVertical ? "1px" : "80px",
    transition: "border-color 0.2s ease-in-out",
  };
};

const getLabelStyles = (position: Position): CSSProperties => {
  const baseStyles: CSSProperties = {
    position: "absolute",
    backgroundColor: "var(--color-background)",
    padding: "2px 6px",
    borderRadius: 4,
    zIndex: 1,
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  switch (position) {
    case Position.Top: {
      return {
        ...baseStyles,
        bottom: "calc(100% + 4px)",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
    case Position.Bottom: {
      return {
        ...baseStyles,
        top: "calc(100% + 4px)",
        left: "50%",
        transform: "translateX(-50%)",
      };
    }
    case Position.Left: {
      return {
        ...baseStyles,
        right: "calc(100% + 4px)",
        top: "50%",
        transform: "translateY(-50%)",
      };
    }
    case Position.Right: {
      return {
        ...baseStyles,
        left: "calc(100% + 4px)",
        top: "50%",
        transform: "translateY(-50%)",
      };
    }
    default: {
      return baseStyles;
    }
  }
};

const HandleNotch = ({
  color,
  handleType,
  visible,
  isVertical,
  selected,
}: {
  color: string;
  handleType: "artifact" | "input" | "output";
  visible: boolean;
  isVertical?: boolean;
  selected: boolean;
}) => {
  const notchStyles: CSSProperties = {
    width: handleType === "input" && !isVertical ? 5 : 8,
    height: handleType === "input" && isVertical ? 5 : 8,
    borderWidth: 0,
    borderRadius: handleType === "artifact" || handleType === "input" ? 0 : "50%",
    transform: handleType === "artifact" ? "rotate(45deg)" : undefined,
    backgroundColor: selected ? "var(--color-selection-indicator)" : color,
    opacity: visible ? 1 : 0,
  };

  return <div style={notchStyles} />;
};

const ButtonHandle = ({
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
}: {
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
}) => {
  const isVertical = position === Position.Top || position === Position.Bottom;
  const buttonRef = useRef<HTMLDivElement>(null);

  // Calculate position along the edge for multiple handles
  const PERCENT_MULTIPLIER = 100;
  const positionPercent = ((index + 1) / (total + 1)) * PERCENT_MULTIPLIER;

  const handleStyle: CSSProperties = {
    width: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    opacity: visible ? 1 : 0,
  };

  // Position handle along the edge based on index and total
  if (total > 1) {
    if (position === Position.Top) {
      handleStyle.top = "0";
      handleStyle.left = `${positionPercent}%`;
      handleStyle.transform = "translate(-50%, -50%)";
    } else if (position === Position.Bottom) {
      handleStyle.bottom = "0";
      handleStyle.left = `${positionPercent}%`;
      handleStyle.transform = "translate(-50%, 50%)";
    } else if (position === Position.Left) {
      handleStyle.left = "0";
      handleStyle.top = `${positionPercent}%`;
      handleStyle.transform = "translate(-50%, -50%)";
    } else if (position === Position.Right) {
      handleStyle.right = "0";
      handleStyle.top = `${positionPercent}%`;
      handleStyle.transform = "translate(50%, -50%)";
    }
  }

  // For single handles, React Flow's default positioning works correctly
  // No need to add manual offsets
  const handleButtonClick = (event: React.MouseEvent) => {
    if (onClick) {
      // Create a new event with the button element as currentTarget and handle ID
      const newEvent = {
        ...event,
        currentTarget: buttonRef.current,
        handleId: id,
      } as React.MouseEvent & { handleId?: string };
      onClick(newEvent);
    }
  };

  return (
    <Handle type={type} position={position} id={id} style={handleStyle} isConnectable={handleType !== "artifact"}>
      {label && (
        <div style={getLabelStyles(position)}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {labelIcon}
            <ApTypography color="var(--color-foreground-de-emp)" variant={FontVariantToken.fontSizeSBold}>
              {label}
            </ApTypography>
          </div>
        </div>
      )}
      {showButton && onClick && (
        <div style={getWrapperPositionStyles(position)}>
          <div style={getLineStyles(isVertical, selected)} />
          <div className="nodrag nopan" style={{ pointerEvents: "auto" }}>
            <AddButton ref={buttonRef} onClick={handleButtonClick} />
          </div>
        </div>
      )}
      <HandleNotch color={color} handleType={handleType} visible={visible} isVertical={isVertical} selected={selected} />
    </Handle>
  );
};

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

export const ButtonHandles = ({
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
          showButton={handle.showButton}
          color={handle.color}
          onClick={handle.onClick}
        />
      ))}
    </>
  );
};
