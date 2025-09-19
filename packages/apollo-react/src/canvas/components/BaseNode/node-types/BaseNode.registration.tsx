import { Position } from "@uipath/uix/xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

export const baseNodeRegistration: NodeRegistration = {
  nodeType: "baseNode",
  category: "actions",
  displayName: "Base Node",
  description: "Generic base node for canvas operations",
  icon: "settings",
  tags: ["basic", "general", "action", "workflow"],
  sortOrder: 100,
  version: "1.0.0",

  definition: {
    getIcon: (data: any, _context) => {
      // Use provided icon or default
      if (data.icon) {
        return data.icon;
      }
      return <ApIcon variant="outlined" name="circle" color="var(--color-foreground-de-emp)" size="40px" />;
    },

    getDisplay: (data: any, _context) => ({
      label: data.label || data.display?.label || "Node",
      subLabel: data.subLabel || data.display?.subLabel,
      shape: (data.shape || "square") as any,
    }),

    getAdornments: (_data: any, _context) => ({}),

    getHandleConfigurations: (data: any, _context) => {
      // DEPRECATED: Reading handleConfigurations from data is deprecated.
      // Each node type should define its own handle configurations.
      // This is only kept for backward compatibility during migration.
      if (data.handleConfigurations) {
        console.warn(
          `Node ${data.label || "unknown"}: handleConfigurations in data is deprecated. ` +
            `Please use a specific node type registration instead.`
        );
        return data.handleConfigurations;
      }

      // Default configuration - simple input/output
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
