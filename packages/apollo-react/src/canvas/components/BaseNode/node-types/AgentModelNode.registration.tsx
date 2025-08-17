import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../types";
import { Row, Icons } from "@uipath/uix-core";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentModelNodeRegistration: NodeRegistration = {
  nodeType: "agent.model",
  category: "ai",
  displayName: "Model",
  description: "",
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => (
      <Row style={{ color: "var(--color-foreground-de-emp)" }}>
        <Icons.OpenAIIcon />
      </Row>
    ),

    getDisplay: (data, context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: "circle" as const,
    }),

    getAdornments: (data, context) => ({}),

    getHandleConfigurations: (data, context) => [
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

    getMenuItems: (data, context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (parameters) => true,
  },
};
