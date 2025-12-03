import { Position } from "@uipath/uix/xyflow/react";
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
    getIcon: (_data, _context) => <ApIcon name="business_center" color="var(--uix-canvas-foreground-de-emp)" size="40px" />,

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
