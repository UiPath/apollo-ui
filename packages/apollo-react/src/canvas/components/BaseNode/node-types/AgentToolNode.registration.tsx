import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentToolNodeRegistration: NodeRegistration = {
  nodeType: "agent.tool",
  category: "ai",
  displayName: "Agent Tool",
  description: "Add tools and functions for AI agents to use",
  icon: "build",
  tags: ["tool", "function", "agent", "capability", "action", "api"],
  sortOrder: 6,
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="business_center" color="var(--color-foreground-de-emp)" size="40px" />,

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
