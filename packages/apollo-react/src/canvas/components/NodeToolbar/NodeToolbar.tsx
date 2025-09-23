import { memo } from "react";
import { AnimatePresence } from "motion/react";
import { ApIcon, ApTooltip } from "@uipath/portal-shell-react";
import {
  StyledToolbarContainer,
  StyledToolbarButton,
  StyledToolbarSeparator,
  StyledDropdownMenu,
  StyledDropdownItem,
  StyledOverflowContainer,
} from "./NodeToolbar.styles";
import type { NodeToolbarProps } from "./NodeToolbar.types";
import { ToolbarButton } from "./ToolbarButton";
import { useToolbarState } from "./useToolbarState";

const NodeToolbarComponent = ({ nodeId, config, visible }: NodeToolbarProps) => {
  const {
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    buttonRef,
    actionsWithState,
    overflowActionsWithState,
    shouldShowToolbar,
    toggleDropdown,
  } = useToolbarState({ config, visible, nodeId });

  if (config.actions.length === 0 && (!config.overflowActions || config.overflowActions.length === 0)) {
    return null;
  }

  // TODO: Localization
  return (
    <AnimatePresence>
      {shouldShowToolbar && (
        <StyledToolbarContainer
          layout
          $position={config.position || "top"}
          $align={config.align || "end"}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          role="toolbar"
        >
          {actionsWithState.map((action) => (
            <ToolbarButton key={action.id} action={action} />
          ))}
          {overflowActionsWithState.length > 0 && (
            <>
              {actionsWithState.length > 0 && <StyledToolbarSeparator />}
              <StyledOverflowContainer>
                <StyledToolbarButton
                  ref={buttonRef}
                  type="button"
                  className="nodrag nopan"
                  onClick={toggleDropdown}
                  aria-label="More options"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="menu"
                >
                  <ApTooltip content="More options" placement="top">
                    <ApIcon variant="outlined" name="more_vert" size="16px" />
                  </ApTooltip>
                </StyledToolbarButton>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <StyledDropdownMenu
                      ref={dropdownRef}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      role="menu"
                      aria-labelledby={buttonRef.current?.id}
                    >
                      {overflowActionsWithState.map((action) => (
                        <StyledDropdownItem
                          key={action.id}
                          type="button"
                          className="nodrag nopan"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!action.disabled) {
                              action.onClick();
                              setIsDropdownOpen(false);
                            }
                          }}
                          aria-label={action.label}
                          aria-disabled={action.disabled}
                          role="menuitem"
                          $disabled={action.disabled}
                        >
                          <ApIcon variant="outlined" name={action.icon} size="16px" />
                          <span>{action.label}</span>
                        </StyledDropdownItem>
                      ))}
                    </StyledDropdownMenu>
                  )}
                </AnimatePresence>
              </StyledOverflowContainer>
            </>
          )}
        </StyledToolbarContainer>
      )}
    </AnimatePresence>
  );
};

export const NodeToolbar = memo(NodeToolbarComponent);
