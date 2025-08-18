import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { Icons } from "@uipath/uix-core";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentMemoryNodeRegistration: NodeRegistration = {
  nodeType: "agent.memory",
  category: "ai",
  displayName: "Agent Memory",
  description: "Configure agent memory and conversation history",
  icon: "memory",
  tags: ["memory", "agent", "history", "conversation", "context", "storage"],
  sortOrder: 4,
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="memory" color="var(--color-foreground-de-emp)" size="40px" />,

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
