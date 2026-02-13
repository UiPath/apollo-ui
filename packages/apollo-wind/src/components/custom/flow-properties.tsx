import { PropertiesBar } from './flow-properties-bar';
import { PropertiesExpanded } from './flow-properties-expanded';
import { cn } from '@/lib';

// ============================================================================
// Types
// ============================================================================

export interface FlowPropertiesProps {
  className?: string;
  /** When false, renders the collapsed bar; when true, renders the expanded panel */
  expanded?: boolean;
  /** Flow name (collapsed bar) */
  flowName?: string;
  /** Flow type label, e.g. "Workflow" (collapsed bar) */
  flowType?: string;
  /** Node name (expanded panel header) */
  nodeName?: string;
  /** Node type label, e.g. "AI Agent" (expanded panel header) */
  nodeType?: string;
  /** Active tab: 'properties' | 'variables' */
  activeTab?: 'properties' | 'variables';
  /** Callback when tab changes */
  onTabChange?: (tab: 'properties' | 'variables') => void;
  /** Callback when user expands (e.g. clicks Properties in the bar) */
  onExpand?: () => void;
  /** Callback when user closes the expanded panel */
  onClose?: () => void;
}

// ============================================================================
// FlowProperties
// ============================================================================

/**
 * Flow properties UI in one of two states: collapsed (bar on canvas) or expanded (full panel).
 *
 * Use `expanded` to switch. Collapsed shows flow name/type and Properties/Variables tabs;
 * expanded shows the full node properties panel with header, toolbar, code, and input/output.
 */
export function FlowProperties({
  className,
  expanded = false,
  flowName = 'Invoice processing',
  flowType = 'Workflow',
  nodeName = 'Validate invoice',
  nodeType = 'AI Agent',
  activeTab = 'properties',
  onTabChange,
  onExpand,
  onClose,
}: FlowPropertiesProps) {
  if (expanded) {
    return (
      <PropertiesExpanded
        className={cn(className)}
        nodeName={nodeName}
        nodeType={nodeType}
        activeTab={activeTab}
        onClose={onClose}
      />
    );
  }

  return (
    <PropertiesBar
      className={className}
      flowName={flowName}
      flowType={flowType}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onExpand={onExpand}
    />
  );
}
