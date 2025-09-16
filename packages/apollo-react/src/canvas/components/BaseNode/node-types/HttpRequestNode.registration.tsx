import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import { ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";

// TODO: convert this to a function, that takes a translate function to support localization

export const httpRequestNodeRegistration: NodeRegistration = {
  nodeType: "http-request",
  category: "integrations",
  displayName: "HTTP Request",
  description: "Make HTTP requests to external APIs and web services",
  icon: "public",
  tags: ["http", "api", "rest", "web", "request", "integration"],
  sortOrder: 10,
  version: "1.0.0",

  definition: {
    getIcon: (data, _context) => <ApIcon name="public" color={data.display?.iconColor || "var(--color-foreground-de-emp)"} size="40px" />,

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: data.display?.shape ?? ("square" as const),
      background: data.display?.background,
      iconBackground: data.display?.iconBackground,
      iconColor: data.display?.iconColor,
    }),

    getAdornments: (data, _context) => {
      const method = data.parameters.method as string;

      return {
        topRight: <></>,
        topLeft: <circle cx="12" cy="12" r="10" stroke="red" strokeWidth="2" fill="white" />,
        bottomLeft: <ApTypography variant={FontVariantToken.fontMonoXS}>{method}</ApTypography>,
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
      url: "",
      method: "GET",
      headers: {},
      body: "",
      timeout: 30000,
      includeErrorOutput: false,
      lastStatusCode: undefined,
      lastResponseTime: undefined,
    }),

    validateParameters: (parameters) => {
      const url = parameters.url as string;
      const method = parameters.method as string;

      if (!url?.trim() || !method) return false;

      try {
        new URL(url);
        return ["GET", "POST", "PUT", "DELETE", "PATCH"].includes(method);
      } catch {
        return false;
      }
    },
  },
};
