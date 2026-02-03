/**
 * Slot Configuration Types
 *
 * Serializable slot configurations that describe WHAT to render, not HOW.
 * These configs replace React.ReactNode props in BaseNodeData to enable:
 * - JSON serialization (save/load workflows)
 * - Framework-agnostic data layer
 * - Undo/redo and diffing capabilities
 * - Debugging and collaboration features
 */

/**
 * Icon slot - renders an icon from the registry
 * Icons can be:
 * - UIPath custom icons (e.g., 'agent', 'connector')
 * - Lucide icons via kebab-case (e.g., 'arrow-right', 'file-text')
 * - External URLs (e.g., 'https://example.com/icon.svg')
 */
export interface IconSlotConfig {
  type: 'icon';
  iconId: string;
  size?: number;
  color?: string;
}

/**
 * Text slot - renders styled text content
 * Wrapper components should resolve i18n strings before creating configs
 */
export interface TextSlotConfig {
  type: 'text';
  content: string;
  variant?: 'body' | 'caption' | 'label';
  color?: string;
  weight?: 'normal' | 'medium' | 'bold';
}

/**
 * Badge slot - renders a badge with optional icon and label
 * Event handlers are referenced by ID (registered in SlotRegistry)
 */
export interface BadgeSlotConfig {
  type: 'badge';
  iconId?: string;
  label?: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  interactive?: boolean;
  onClick?: string; // Event handler ID (not function reference)
}

/**
 * Status icon slot - renders execution status indicators
 * Used for displaying node execution state (running, success, failed, etc.)
 */
export interface StatusIconSlotConfig {
  type: 'status-icon';
  status?: string;
  size?: number;
}

/**
 * Custom slot - references a registered renderer by ID
 * Allows wrapper components to register complex custom components
 * Props must be serializable (no functions or React elements)
 */
export interface CustomSlotConfig {
  type: 'custom';
  slotId: string;
  props?: Record<string, unknown>; // Serializable props only
}

/**
 * Composite slot - renders multiple slots in a layout
 * Supports horizontal or vertical layouts with configurable spacing
 * Slots can be nested (composite within composite)
 */
export interface CompositeSlotConfig {
  type: 'composite';
  layout: 'horizontal' | 'vertical';
  spacing?: number;
  slots: SlotConfig[];
}

/**
 * Union of all slot configuration types
 * Discriminated by the 'type' field for type-safe exhaustive switching
 */
export type SlotConfig =
  | IconSlotConfig
  | TextSlotConfig
  | BadgeSlotConfig
  | StatusIconSlotConfig
  | CustomSlotConfig
  | CompositeSlotConfig;

/**
 * Display slot configurations (replaces ReactNode display props)
 * Used for main node content areas
 */
export interface DisplaySlotConfigs {
  icon?: SlotConfig;
  subLabel?: SlotConfig;
  centerAdornment?: SlotConfig;
  footer?: SlotConfig;
}

/**
 * Adornment slot configurations (replaces ReactNode adornment props)
 * Used for corner badges and indicators
 */
export interface AdornmentSlotConfigs {
  topLeft?: SlotConfig;
  topRight?: SlotConfig;
  bottomLeft?: SlotConfig;
  bottomRight?: SlotConfig;
}
