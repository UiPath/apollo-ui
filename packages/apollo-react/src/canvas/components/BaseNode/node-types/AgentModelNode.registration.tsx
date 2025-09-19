import { Position } from "@uipath/uix-xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { Row, Icons } from "@uipath/uix-core";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentModelNodeRegistration: NodeRegistration = {
  nodeType: "agent.model",
  category: "ai",
  displayName: "AI Model",
  description: "Configure AI model settings and parameters",
  icon: "model_training",
  tags: ["model", "ai", "llm", "gpt", "claude", "gemini", "configuration"],
  sortOrder: 3,
  version: "1.0.0",

  definition: {
    getIcon: (_data, _context) => (
      <Row style={{ color: "var(--color-foreground-de-emp)" }}>
        <Icons.OpenAIIcon />
      </Row>
    ),

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: "circle" as const,
    }),

    getAdornments: (_data, _context) => ({}),

    getHandleConfigurations: (_data, _context) => [
      {
        position: Position.Top,
        handles: [
          {
            id: "context",
            type: "target",
            handleType: "artifact",
          },
        ],
      },
    ],

    getMenuItems: (_data, _context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (_parameters) => true,
  },
};
