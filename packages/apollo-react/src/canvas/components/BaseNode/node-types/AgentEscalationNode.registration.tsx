import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentEscalationNodeRegistration: NodeRegistration = {
  nodeType: "agent.escalation",
  category: "ai",
  displayName: "Agent Escalation",
  description: "Define escalation paths and human-in-the-loop workflows",
  icon: "support_agent",
  tags: ["escalation", "human", "handoff", "agent", "support", "fallback"],
  sortOrder: 5,
  version: "1.0.0",

  definition: {
    getIcon: (_data, _context) => <ApIcon name="person" color="var(--color-foreground-de-emp)" size="40px" />,

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
