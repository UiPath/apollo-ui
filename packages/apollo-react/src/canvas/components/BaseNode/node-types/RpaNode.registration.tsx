import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const rpaNodeRegistration: NodeRegistration = {
  nodeType: "rpa",
  category: "actions",
  displayName: "Run RPA Job",
  description: "Execute RPA robots and automated workflows",
  icon: "precision_manufacturing",
  tags: ["rpa", "robot", "automation", "uipath", "workflow", "job", "orchestrator"],
  sortOrder: 15,
  version: "1.0.0",

  definition: {
    getIcon: (data, _context) => <ApIcon name="list_alt" color={data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />,

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: data.display?.shape ?? ("square" as const),
      background: data.display?.background,
      iconBackground: data.display?.iconBackground,
      iconColor: data.display?.iconColor,
    }),

    getAdornments: (data, context) => {
      const state = context.executionState;
      const status = typeof state === "string" ? state : state?.status;
      const robotType = data.parameters.robotType as string;

      return {
        topRight: status ? (
          <circle
            cx="8"
            cy="8"
            r="6"
            fill={status === "running" ? "#F59E0B" : status === "success" ? "#10B981" : status === "error" ? "#EF4444" : "#6B7280"}
          />
        ) : undefined,
        bottomLeft: robotType ? (
          <div
            style={{
              fontSize: "8px",
              padding: "1px 2px",
              backgroundColor: "#F97316",
              color: "white",
              borderRadius: "3px",
            }}
          >
            {robotType === "attended" ? "ATD" : "UNATD"}
          </div>
        ) : undefined,
      };
    },

    getHandleConfigurations: (_data, _context) => [
      {
        position: Position.Left,
        handles: [{ id: "trigger", label: "Trigger", type: "target", handleType: "input" }],
        visible: true,
      },
      {
        position: Position.Right,
        handles: [{ id: "success", label: "Success", type: "source", handleType: "output" }],
        visible: true,
      },
    ],

    getMenuItems: (_data, _context) => [],

    getDefaultParameters: () => ({
      robotName: "",
      processName: "",
      robotType: "unattended", // attended, unattended
      orchestratorUrl: "",
      tenantName: "",
      inputArguments: {},
      outputArguments: {},
      hasInputArguments: false,
      hasOutputArguments: false,
      isConnected: false,
      lastJobId: undefined,
      timeout: 300000, // 5 minutes
    }),

    validateParameters: (parameters) => {
      const robotName = parameters.robotName as string;
      const processName = parameters.processName as string;
      const orchestratorUrl = parameters.orchestratorUrl as string;

      if (!robotName?.trim() || !processName?.trim()) return false;

      if (orchestratorUrl) {
        try {
          new URL(orchestratorUrl);
        } catch {
          return false;
        }
      }

      return true;
    },
  },
};
