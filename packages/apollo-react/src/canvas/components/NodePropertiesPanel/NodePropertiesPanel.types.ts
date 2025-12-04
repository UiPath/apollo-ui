import type { Node } from "@uipath/uix/xyflow/react";

export type FieldType = "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "time";

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface ValidationRule<T = unknown> {
  type: "required" | "min" | "max" | "pattern" | "custom";
  value?: T;
  message?: string;
  validator?: (value: T) => boolean;
}

export interface ConfigField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: unknown;
  validation?: ValidationRule<unknown>[];
  options?: SelectOption[];
  debounce?: number;
  disabled?: boolean;
  helpText?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
}

export interface ConfigSection {
  id: string;
  title: string;
  fields: ConfigField[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface NodeConfigSchema {
  fields?: ConfigField[];
  sections?: ConfigSection[];
  layout?: "vertical" | "horizontal";
}

export interface NodePropertiesPanelProps {
  nodeId?: string;
  onClose?: () => void;
  position?: "left" | "right" | "auto";
  customSchemas?: Record<string, NodeConfigSchema>;
  enableValidation?: boolean;
  onChange?: (nodeId: string, field: string, value: unknown) => void;
  maintainSelection?: boolean;
  defaultPinned?: boolean;
  onPinnedChange?: (pinned: boolean) => void;
}

export interface StageNodeConfig {
  name: string;
  description: string;
  markAsException?: boolean;
  slaLength?: number;
  slaUnit?: "Days" | "Hours" | "Minutes";
}

export interface AgentNodeConfig {
  name: string;
  description: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export type NodeConfigData = StageNodeConfig | AgentNodeConfig | Record<string, unknown>;

export interface ConfigurableNode extends Node {
  data: {
    configSchema?: NodeConfigSchema;
    [key: string]: unknown;
  };
}
