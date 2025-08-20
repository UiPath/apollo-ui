import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentContextNodeRegistration: NodeRegistration = {
  nodeType: "agent.context",
  category: "ai",
  displayName: "Agent Context",
  description: "Provide context and knowledge to AI agents",
  icon: "account_tree",
  tags: ["agent", "context", "knowledge", "ai", "memory", "rag", "retrieval"],
  sortOrder: 2,
  version: "1.0.0",

  definition: {
    getIcon: (_data, _context) => <ApIcon name="account_tree" color="var(--color-foreground-de-emp)" size="40px" />,

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: "circle" as const,
    }),

    getAdornments: (_data, _context) => ({}),

    getHandleConfigurations: (_data, _context) => [
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

    getMenuItems: (_data, _context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (_parameters) => true,
  },
};
