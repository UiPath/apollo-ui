import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const connectorNodeRegistration: NodeRegistration = {
  nodeType: "connector",
  category: "integrations",
  displayName: "Connector",
  description: "Connect to external systems and services",
  icon: "cable",
  tags: ["connector", "integration", "api", "service", "external", "database", "saas"],
  sortOrder: 12,
  version: "1.0.0",

  definition: {
    getIcon: (data, context) => <ApIcon name="code" color="var(--color-foreground-de-emp)" size="40px" />,

    getDisplay: (data, context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: "square" as const,
    }),

    getAdornments: (data, context) => {
      const status = context.executionStatus;
      const language = data.parameters.language as string;
      const hasError = status === "error";

      return {
        topRight: language ? (
          <div
            style={{
              fontSize: "10px",
              padding: "2px 4px",
              backgroundColor: "#3B82F6",
              color: "white",
              borderRadius: "3px",
            }}
          >
            {language.toUpperCase()}
          </div>
        ) : undefined,
        topLeft: status ? (
          <circle
            cx="8"
            cy="8"
            r="6"
            fill={status === "running" ? "#F59E0B" : status === "success" ? "#10B981" : status === "error" ? "#EF4444" : "#6B7280"}
          />
        ) : undefined,
        bottomLeft: hasError ? <ApIcon name="warning" color="#EF4444" size="16px" /> : undefined,
      };
    },

    getHandleConfigurations: (data, context) => [
      {
        position: Position.Left,
        handles: [{ id: "input", label: "Input", type: "target", handleType: "input" }],
        visible: true,
      },
      {
        position: Position.Right,
        handles: [{ id: "output", label: "Output", type: "source", handleType: "output" }],
        visible: true,
      },
    ],

    getMenuItems: (data, context) => {
      return [];
    },

    getDefaultParameters: () => ({
      context: {
        connectorId: "slack",
      },
    }),

    validateParameters: (parameters) => {
      const script = parameters.script as string;
      const language = parameters.language as string;

      if (!script?.trim()) return false;
      if (!["javascript", "python", "powershell", "bash"].includes(language)) return false;

      return true;
    },
  },
};
