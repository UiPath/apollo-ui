import { Position } from "@uipath/uix-xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
// import { Icons } from "@uipath/uix-core";
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
    getIcon: (_data, _context) => <ApIcon name="memory" color="var(--color-foreground-de-emp)" size="40px" />,

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
