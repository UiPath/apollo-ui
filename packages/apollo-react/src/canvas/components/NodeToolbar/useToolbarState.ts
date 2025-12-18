import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { NodeToolbarConfig, ToolbarSeparator, ToolbarActionItem } from "./NodeToolbar.types";
import type { ProcessedToolbarItem } from "./NodeToolbar.utils";

export interface UseToolbarStateProps {
  config: NodeToolbarConfig;
  expanded: boolean;
  nodeId: string;
  hidden?: boolean;
}

export type ToolbarDisplayState = "hidden" | "pinned" | "expanded";

export interface UseToolbarStateReturn {
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  displayState: ToolbarDisplayState;
  shouldShowOverflow: boolean;
  actionsToDisplay: ProcessedToolbarItem[];
  overflowActionsToDisplay: ProcessedToolbarItem[];
  separatorOrientation: "horizontal" | "vertical";
  toggleDropdown: (e: React.MouseEvent) => void;
}

export const useToolbarState = ({ config, expanded, nodeId, hidden }: UseToolbarStateProps): UseToolbarStateReturn => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extend actions with pre-bound onClick handlers
  const actionsWithState = useMemo<ProcessedToolbarItem[]>(() => {
    return config.actions.map((action): ProcessedToolbarItem => {
      if (action.id === "separator") {
        return action as ToolbarSeparator;
      }
      const item = action as ToolbarActionItem;
      return {
        ...item,
        onClick: () => {
          try {
            item.onAction(nodeId);
          } catch (error) {
            console.error(`Error executing action ${item.id}:`, error);
          }
        },
      };
    });
  }, [config.actions, nodeId]);

  // Extract pinned actions
  const pinnedActions = useMemo<ProcessedToolbarItem[]>(
    () =>
      actionsWithState.filter(
        (action): action is ProcessedToolbarItem => action.id !== "separator" && !!(action as ToolbarActionItem).isPinned
      ),
    [actionsWithState]
  );

  const overflowActionsWithState = useMemo<ProcessedToolbarItem[]>(() => {
    if (!config.overflowActions) return [];
    return config.overflowActions.map((action): ProcessedToolbarItem => {
      if (action.id === "separator") {
        return action as ToolbarSeparator;
      }
      const item = action as ToolbarActionItem;
      return {
        ...item,
        onClick: () => {
          try {
            item.onAction(nodeId);
          } catch (error) {
            console.error(`Error executing action ${item.id}:`, error);
          }
        },
      };
    });
  }, [config.overflowActions, nodeId]);

  // Compute display state
  const displayState = useMemo<ToolbarDisplayState>(() => {
    if (hidden) return "hidden";
    if (expanded) return "expanded";
    return pinnedActions.length > 0 ? "pinned" : "hidden";
  }, [hidden, expanded, pinnedActions.length]);

  // Determine what actions to display based on display state
  const actionsToDisplay = useMemo(() => {
    if (displayState === "hidden") return [];
    if (displayState === "expanded") return actionsWithState;
    return pinnedActions;
  }, [displayState, actionsWithState, pinnedActions]);

  // Determine rendering mode
  const shouldShowOverflow = displayState === "expanded" && overflowActionsWithState.length > 0;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Reset dropdown when toolbar is hidden
  useEffect(() => {
    if (!shouldShowOverflow && isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  }, [shouldShowOverflow, isDropdownOpen]);

  // Toggle dropdown handler
  const toggleDropdown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDropdownOpen((prev) => !prev);
  }, []);

  return {
    isDropdownOpen,
    setIsDropdownOpen,
    dropdownRef,
    buttonRef,
    shouldShowOverflow,
    displayState,
    actionsToDisplay,
    overflowActionsToDisplay: overflowActionsWithState,
    separatorOrientation: config.position === "top" || config.position === "bottom" ? "vertical" : "horizontal",
    toggleDropdown,
  };
};
