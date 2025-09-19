import { Position } from "@uipath/uix-xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

export const activityNodeRegistration: NodeRegistration = {
  nodeType: "activity",
  category: "actions",
  displayName: "Activity",
  description: "Generic activity for workflow actions",
  icon: "task_alt",
  tags: ["activity", "action", "task", "step", "workflow"],
  sortOrder: 50,
  version: "1.0.0",

  definition: {
    getIcon: (data: any, _context) => {
      if (data.icon) {
        return data.icon;
      }
      return <ApIcon name="settings" color="var(--color-foreground-de-emp)" size="40px" />;
    },

    getDisplay: (data: any, _context) => ({
      label: data.label || data.display?.label || "Activity",
      subLabel: data.subLabel || data.display?.subLabel,
      shape: (data.shape || "square") as any,
    }),

    getAdornments: (_data: any, _context) => ({}),

    getHandleConfigurations: (data: any, _context) => {
      if (data.handleConfigurations) {
        return data.handleConfigurations;
      }

      return [
        {
          position: Position.Left,
          handles: [
            {
              id: "input",
              type: "target" as const,
              handleType: "input" as const,
            },
          ],
        },
        {
          position: Position.Right,
          handles: [
            {
              id: "output",
              type: "source" as const,
              handleType: "output" as const,
            },
          ],
        },
      ];
    },

    getMenuItems: (_data: any, _context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (_parameters) => true,
  },
};
