import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentContextNodeRegistration: NodeRegistration = {
  nodeType: "agent.context",
  category: "ai",
  displayName: "Context",
  description: "",
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="account_tree" color="var(--color-foreground-de-emp)" size="40px" />,

    getAdornments: (data, context) => ({}),

    getHandleConfigurations: (data, context) => [
      {
        position: Position.Bottom,
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

    getDefaultDisplay: () => ({
      shape: "circle" as const,
    }),

    validateParameters: (parameters) => true,
  },
};
