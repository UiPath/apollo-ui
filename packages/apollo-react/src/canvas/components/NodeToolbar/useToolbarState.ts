import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { NodeToolbarConfig, ToolbarSeparator, ToolbarActionItem } from "./NodeToolbar.types";
import type { ProcessedToolbarItem } from "./NodeToolbar.utils";

export interface UseToolbarStateProps {
  config: NodeToolbarConfig;
  visible: boolean;
  nodeId: string;
}

export interface UseToolbarStateReturn {
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  actionsWithState: ProcessedToolbarItem[];
  overflowActionsWithState: ProcessedToolbarItem[];
  shouldShowToolbar: boolean;
  toggleDropdown: (e: React.MouseEvent) => void;
}

export const useToolbarState = ({ config, visible, nodeId }: UseToolbarStateProps): UseToolbarStateReturn => {
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

  // Determine if toolbar should be shown
  const shouldShowToolbar = visible;

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
    if (!shouldShowToolbar && isDropdownOpen) {
      setIsDropdownOpen(false);
    }
  }, [shouldShowToolbar, isDropdownOpen]);

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
    actionsWithState,
    overflowActionsWithState,
    shouldShowToolbar,
    toggleDropdown,
  };
};
