import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const genericNodeRegistration: NodeRegistration = {
  nodeType: "generic",
  category: "actions",
  displayName: "Generic Node",
  description: "General purpose node for custom operations",
  icon: "widgets",
  tags: ["generic", "custom", "general", "utility"],
  sortOrder: 90,
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="circle" color={data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />,

    getDisplay: (data, context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: data.display?.shape ?? ("square" as const),
      background: data.display?.background,
      iconBackground: data.display?.iconBackground,
      iconColor: data.display?.iconColor,
    }),

    getAdornments: (data, context) => ({}),

    getHandleConfigurations: (data, context) => [
      {
        position: Position.Bottom,
        handles: [
          {
            id: "bottom",
            type: "target",
            handleType: "input",
          },
        ],
      },
    ],

    getMenuItems: (data, context) => [],

    getDefaultParameters: () => ({}),

    validateParameters: (parameters) => true,
  },
};
