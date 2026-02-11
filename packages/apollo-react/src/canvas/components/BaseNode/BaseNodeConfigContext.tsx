import { createContext, useContext } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import type { HandleActionEvent } from '../ButtonHandle/ButtonHandle';
import type { NodeToolbarConfig } from '../Toolbar';
import type { FooterVariant, NodeAdornments } from './BaseNode.types';

/**
 * Runtime configuration for BaseNode, provided via context.
 *
 * Separates non-serializable runtime concerns (callbacks, ReactNode, UI config)
 * from the serializable `BaseNodeData` in node.data.
 *
 * Parent node components (AgentNode, ResourceNode, etc.) wrap `<BaseNode>`
 * in a `<BaseNodeOverrideConfigProvider>` to supply these values.
 *
 * Consumers should not use this directly, as this is only a backwards compatibility layer for
 * AgentFlow nodes and CodedAgentFlow nodes.
 */
export interface BaseNodeOverrideConfig {
  // Callbacks (Runtime Behavior)
  onHandleAction?: (event: HandleActionEvent) => void;
  shouldShowAddButtonFn?: (opts: { showAddButton: boolean; selected: boolean }) => boolean;
  shouldShowButtonHandleNotchesFn?: (opts: {
    isConnecting: boolean;
    isSelected: boolean;
    isHovered: boolean;
  }) => boolean;

  // UI Configuration (Non-Serializable)
  toolbarConfig?: NodeToolbarConfig | null;
  handleConfigurations?: HandleGroupManifest[];
  adornments?: NodeAdornments;

  // Visual State
  suggestionType?: 'add' | 'update' | 'delete';
  disabled?: boolean;
  executionStatusOverride?: string;

  // Display Customization
  labelTooltip?: string;
  labelBackgroundColor?: string;
  footerVariant?: FooterVariant;
  footerComponent?: React.ReactNode;
  subLabelComponent?: React.ReactNode;
  iconComponent?: React.ReactNode;
}

const EMPTY_CONFIG: BaseNodeOverrideConfig = {};

const BaseNodeOverrideConfigContext = createContext<BaseNodeOverrideConfig>(EMPTY_CONFIG);

export const BaseNodeOverrideConfigProvider = BaseNodeOverrideConfigContext.Provider;

/**
 * Access BaseNode runtime configuration from context.
 * Returns empty config when used outside a BaseNodeOverrideConfigProvider (graceful fallback).
 */
export function useBaseNodeOverrideConfig(): BaseNodeOverrideConfig {
  return useContext(BaseNodeOverrideConfigContext);
}
