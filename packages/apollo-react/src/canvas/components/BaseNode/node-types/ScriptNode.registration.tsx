import { Position } from "@uipath/uix/xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon } from "@uipath/portal-shell-react";

// TODO: convert this to a function, that takes a translate function to support localization

export const scriptNodeRegistration: NodeRegistration = {
  nodeType: "script-task",
  category: "actions",
  displayName: "Script Task",
  description: "Execute custom scripts and code snippets",
  icon: "code",
  tags: ["script", "code", "automation", "python", "javascript", "powershell", "bash"],
  sortOrder: 20,
  version: "1.0.0",

  definition: {
    getIcon: (data, _context) => (
      <ApIcon name="code" color={data.display?.iconColor || "var(--uix-canvas-foreground-de-emp)"} size="40px" />
    ),

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

    getHandleConfigurations: (_data, _context) => [
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

    getMenuItems: (_data, _context) => [],

    getDefaultParameters: () => ({
      language: "javascript",
      script: "// Your script here\nreturn { result: 'Hello World' };",
      timeout: 30000,
      includeErrorOutput: true,
      variables: {},
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
