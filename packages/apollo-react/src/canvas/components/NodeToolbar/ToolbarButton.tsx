import { memo } from "react";
import { ApIcon, ApTooltip } from "@uipath/portal-shell-react";
import { StyledToolbarButton } from "./NodeToolbar.styles";
import type { ToolbarAction } from "./NodeToolbar.types";

export interface ExtendedToolbarAction extends ToolbarAction {
  onClick: () => void;
}

export interface ToolbarButtonProps {
  action: ExtendedToolbarAction;
}

export const ToolbarButton = memo(({ action }: ToolbarButtonProps) => {
  const isEnabled = !action.disabled;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isEnabled) {
      action.onClick();
    }
  };

  return (
    <StyledToolbarButton
      type="button"
      className="nodrag nopan"
      onClick={handleClick}
      aria-label={action.label}
      aria-disabled={!isEnabled}
      $disabled={!isEnabled}
    >
      <ApTooltip content={action.label} placement="top">
        {action.icon && typeof action.icon === "string" && <ApIcon variant="outlined" name={action.icon} size="16px" />}
        {action.icon && typeof action.icon !== "string" && action.icon}
      </ApTooltip>
    </StyledToolbarButton>
  );
});

ToolbarButton.displayName = "ToolbarButton";
