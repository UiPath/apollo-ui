import { createContext, useContext } from 'react';

export interface GroupNodeConfig {
  /** Custom React elements to render in the group header's control area */
  headerActions?: React.ReactNode;
  /** Execution status for border coloring and pulse animation */
  executionStatus?: string;
  /** Message to display in the execution status tooltip (e.g. error details) */
  executionMessage?: string;
  /** Callback for the 3-dot menu button click */
  onMoreOptions?: () => void;
  /** Whether to hide the 3-dot menu button. Defaults to false (visible). */
  hideMoreOptions?: boolean;
  /** Whether to hide the collapse/expand button. Defaults to false (visible). */
  hideCollapseButton?: boolean;
}

const EMPTY_CONFIG: GroupNodeConfig = {};

const GroupNodeConfigContext = createContext<GroupNodeConfig>(EMPTY_CONFIG);

export const GroupNodeConfigProvider = GroupNodeConfigContext.Provider;

export function useGroupNodeConfig(): GroupNodeConfig {
  return useContext(GroupNodeConfigContext);
}
