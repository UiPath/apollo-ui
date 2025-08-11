import type { NodeConfigSchema } from "./NodePropertiesPanel.types";

// TODO: this is just a proof of concept -- needs to be fleshed out.

export const stageNodeSchema: NodeConfigSchema = {
  sections: [
    {
      id: "general",
      title: "General",
      fields: [
        {
          key: "name",
          label: "Name",
          type: "text",
          placeholder: "Enter stage name",
          validation: [
            { type: "required", message: "Name is required" },
            { type: "min", value: 1, message: "Name must not be empty" },
          ],
          debounce: 300,
        },
        {
          key: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Enter stage description",
          rows: 3,
          debounce: 500,
        },
        {
          key: "markAsException",
          label: "Mark as exception stage",
          type: "checkbox",
          helpText: "Enable this to mark the stage as an exception handler",
        },
      ],
    },
    {
      id: "sla",
      title: "SLA",
      fields: [
        {
          key: "slaLength",
          label: "Length",
          type: "number",
          placeholder: "45",
          min: 0,
          max: 999,
          step: 1,
          validation: [{ type: "min", value: 0, message: "Length must be positive" }],
        },
        {
          key: "slaUnit",
          label: "Time",
          type: "select",
          options: [
            { label: "Minutes", value: "Minutes" },
            { label: "Hours", value: "Hours" },
            { label: "Days", value: "Days" },
            { label: "Weeks", value: "Weeks" },
          ],
          defaultValue: "Days",
        },
      ],
    },
    {
      id: "advanced",
      title: "Advanced Settings",
      fields: [
        {
          key: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "Low", value: "low" },
            { label: "Normal", value: "normal" },
            { label: "High", value: "high" },
            { label: "Critical", value: "critical" },
          ],
          defaultValue: "normal",
        },
        {
          key: "retryCount",
          label: "Retry Count",
          type: "number",
          min: 0,
          max: 10,
          defaultValue: 3,
          helpText: "Number of times to retry on failure",
        },
        {
          key: "timeout",
          label: "Timeout (seconds)",
          type: "number",
          min: 0,
          max: 3600,
          defaultValue: 300,
        },
        {
          key: "enableLogging",
          label: "Enable Detailed Logging",
          type: "checkbox",
          defaultValue: true,
        },
        {
          key: "notificationEmail",
          label: "Notification Email",
          type: "text",
          placeholder: "email@example.com",
          debounce: 500,
        },
        {
          key: "tags",
          label: "Tags",
          type: "text",
          placeholder: "Enter comma-separated tags",
          helpText: "Use tags to categorize and filter stages",
          debounce: 500,
        },
      ],
    },
  ],
};

export const agentNodeSchema: NodeConfigSchema = {
  sections: [
    {
      id: "general",
      title: "General",
      fields: [
        {
          key: "name",
          label: "Agent Name",
          type: "text",
          placeholder: "Enter agent name",
          validation: [{ type: "required", message: "Name is required" }],
          debounce: 300,
        },
        {
          key: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe the agent's purpose",
          rows: 3,
          debounce: 500,
        },
      ],
    },
    {
      id: "configuration",
      title: "Configuration",
      fields: [
        {
          key: "model",
          label: "Model",
          type: "select",
          options: [
            { label: "GPT-4", value: "gpt-4" },
            { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
            { label: "Claude 3 Opus", value: "claude-3-opus" },
            { label: "Claude 3 Sonnet", value: "claude-3-sonnet" },
          ],
          defaultValue: "gpt-4",
        },
        {
          key: "temperature",
          label: "Temperature",
          type: "number",
          min: 0,
          max: 2,
          step: 0.1,
          defaultValue: 0.7,
          helpText: "Controls randomness: 0 is focused, 2 is creative",
        },
        {
          key: "maxTokens",
          label: "Max Tokens",
          type: "number",
          min: 1,
          max: 4096,
          step: 1,
          defaultValue: 1024,
          helpText: "Maximum number of tokens to generate",
        },
      ],
    },
    {
      id: "prompt",
      title: "System Prompt",
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          key: "systemPrompt",
          label: "System Prompt",
          type: "textarea",
          placeholder: "Enter the system prompt for the agent",
          rows: 6,
          debounce: 1000,
        },
      ],
    },
  ],
};

export const artifactNodeSchema: NodeConfigSchema = {
  sections: [
    {
      id: "general",
      title: "Artifact Configuration",
      fields: [
        {
          key: "name",
          label: "Artifact Name",
          type: "text",
          placeholder: "Enter artifact name",
          validation: [{ type: "required", message: "Name is required" }],
          debounce: 300,
        },
        {
          key: "type",
          label: "Type",
          type: "select",
          options: [
            { label: "Document", value: "document" },
            { label: "Code", value: "code" },
            { label: "Data", value: "data" },
            { label: "Model", value: "model" },
            { label: "Other", value: "other" },
          ],
          defaultValue: "document",
        },
        {
          key: "format",
          label: "Format",
          type: "text",
          placeholder: "e.g., JSON, PDF, CSV",
          debounce: 300,
        },
        {
          key: "size",
          label: "Size Limit (MB)",
          type: "number",
          min: 0,
          max: 1000,
          step: 1,
          defaultValue: 10,
        },
        {
          key: "required",
          label: "Required",
          type: "checkbox",
          helpText: "Is this artifact required for the workflow?",
        },
      ],
    },
  ],
};

export const defaultNodeSchema: NodeConfigSchema = {
  fields: [
    {
      key: "label",
      label: "Label",
      type: "text",
      placeholder: "Enter node label",
      debounce: 300,
    },
    {
      key: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter description",
      rows: 3,
      debounce: 500,
    },
  ],
};

export const nodeSchemas: Record<string, NodeConfigSchema> = {
  stage: stageNodeSchema,
  agent: agentNodeSchema,
  artifact: artifactNodeSchema,
  default: defaultNodeSchema,
};
