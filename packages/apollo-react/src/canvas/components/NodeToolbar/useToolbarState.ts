import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { NodeToolbarConfig } from "./NodeToolbar.types";
import type { ExtendedToolbarAction } from "./ToolbarButton";

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
  actionsWithState: ExtendedToolbarAction[];
  overflowActionsWithState: ExtendedToolbarAction[];
  shouldShowToolbar: boolean;
  toggleDropdown: (e: React.MouseEvent) => void;
}

export const useToolbarState = ({ config, visible, nodeId }: UseToolbarStateProps): UseToolbarStateReturn => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extend actions with pre-bound onClick handlers
  const actionsWithState = useMemo<ExtendedToolbarAction[]>(() => {
    return config.actions.map((action) => ({
      ...action,
      onClick: () => {
        try {
          action.onAction(nodeId);
        } catch (error) {
          console.error(`Error executing action ${action.id}:`, error);
        }
      },
    }));
  }, [config.actions, nodeId]);

  const overflowActionsWithState = useMemo<ExtendedToolbarAction[]>(() => {
    if (!config.overflowActions) return [];
    return config.overflowActions.map((action) => ({
      ...action,
      onClick: () => {
        try {
          action.onAction(nodeId);
        } catch (error) {
          console.error(`Error executing action ${action.id}:`, error);
        }
      },
    }));
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
