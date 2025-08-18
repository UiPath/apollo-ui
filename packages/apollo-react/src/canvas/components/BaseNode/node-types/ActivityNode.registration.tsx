import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

export const activityNodeRegistration: NodeRegistration = {
  nodeType: "activity",
  category: "actions",
  displayName: "Activity",
  description: "Generic activity node",
  version: "1.0.0",

  definition: {
    getIcon: (data: any, context) => {
      if (data.icon) {
        return data.icon;
      }
      return <ApIcon name="settings" color="var(--color-foreground-de-emp)" size="40px" />;
    },

    getDisplay: (data: any, context) => ({
      label: data.label || data.display?.label || "Activity",
      subLabel: data.subLabel || data.display?.subLabel,
      shape: (data.shape || "square") as any,
    }),

    getAdornments: (data: any, context) => ({}),

    getHandleConfigurations: (data: any, context) => {
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

    getMenuItems: (data: any, context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (parameters) => true,
  },
};
