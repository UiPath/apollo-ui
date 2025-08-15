import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const genericNodeRegistration: NodeRegistration = {
  nodeType: "generic",
  category: "generic",
  displayName: "Generic",
  description: "",
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="circle" color="var(--color-foreground-de-emp)" size="40px" />,

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

    getDefaultDisplay: () => ({
      shape: "square" as const,
    }),

    validateParameters: (parameters) => true,
  },
};
