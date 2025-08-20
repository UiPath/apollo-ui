import { Position } from "@xyflow/react";
import type { NodeRegistration } from "../BaseNode.types";
import type { HandleActionEvent } from "../../ButtonHandle";
import { Icons } from "@uipath/uix-core";

// TODO: convert this to a function, that takes a translate function to support localization

export const agentNodeRegistration: NodeRegistration = {
  nodeType: "agent",
  category: "ai",
  displayName: "AI Agent",
  description: "Autonomous AI agent for intelligent task execution and decision making",
  icon: "smart_toy",
  tags: ["ai", "agent", "llm", "automation", "intelligent"],
  sortOrder: 1,
  version: "1.0.0",

  definition: {
    getIcon: (data, _context) => (
      <div style={{ color: data.display?.iconColor || "var(--color-foreground-de-emp)" }}>
        <Icons.AgentIcon />
      </div>
    ),

    getDisplay: (data, _context) => ({
      label: data.display?.label,
      subLabel: data.display?.subLabel,
      shape: data.display?.shape ?? ("rectangle" as const),
      background: data.display?.background,
      iconBackground: data.display?.iconBackground,
      iconColor: data.display?.iconColor,
    }),

    getAdornments: (data, context) => {
      const status = context.executionStatus;
      const _agentType = data.parameters.agentType as string;

      return {
        topRight: status ? (
          <circle
            cx="8"
            cy="8"
            r="6"
            fill={status === "running" ? "#F59E0B" : status === "success" ? "#10B981" : status === "error" ? "#EF4444" : "#6B7280"}
          />
        ) : undefined,
      };
    },

    getHandleConfigurations: (_data, _context) => [
      {
        position: Position.Left,
        handles: [
          {
            id: "input",
            type: "target",
            handleType: "input",
          },
        ],
      },
      {
        position: Position.Right,
        handles: [
          {
            id: "output",
            type: "source",
            handleType: "output",
          },
        ],
      },
      {
        position: Position.Top,
        handles: [
          {
            id: "context",
            type: "source",
            handleType: "artifact",
            label: "Context",
          },
        ],
      },
      {
        position: Position.Bottom,
        handles: [
          {
            id: "model",
            type: "source",
            handleType: "artifact",
            label: "Model",
          },
          {
            id: "escalations",
            type: "source",
            handleType: "artifact",
            label: "Escalations",
          },
          {
            id: "tools",
            type: "source",
            handleType: "artifact",
            label: "Tools",
          },
        ],
      },
    ],

    getMenuItems: (_data, _context) => {
      return [];
    },

    getDefaultParameters: () => ({
      agentType: "conversational", // conversational, decision, classification, extraction
      modelName: "gpt-4",
      systemPrompt: "You are a helpful AI assistant.",
      temperature: 0.7,
      maxTokens: 1000,
      useContext: false,
      includeMetadata: false,
      isModelLoaded: false,
      lastResponse: undefined,
      lastConfidence: undefined,
      customInstructions: "",
      outputFormat: "text", // text, json, structured
    }),

    validateParameters: (parameters) => {
      const agentType = parameters.agentType as string;
      const modelName = parameters.modelName as string;
      const systemPrompt = parameters.systemPrompt as string;

      const validAgentTypes = ["conversational", "decision", "classification", "extraction"];

      return validAgentTypes.includes(agentType) && !!modelName?.trim() && !!systemPrompt?.trim();
    },

    // Handle action handler - define default behavior for this node type
    onHandleAction: (event: HandleActionEvent) => {
      console.log(`[Agent Node] Handle action:`, {
        nodeId: event.nodeId,
        handleId: event.handleId,
        handleType: event.handleType,
        position: event.position,
      });

      // Single handler with all context to make decisions
      switch (event.handleType) {
        case "input":
          // Configure input sources
          console.log(`Configure input for ${event.nodeId}`);
          break;

        case "output":
          // Add downstream processing
          console.log(`Add downstream from ${event.nodeId}`);
          break;

        case "artifact":
          // Different behavior based on which artifact handle
          switch (event.handleId) {
            case "model":
              console.log("Select AI model");
              break;
            case "context":
              console.log("Configure context sources");
              break;
            case "tools":
              console.log("Add available tools");
              break;
            case "escalations":
              console.log("Set up escalation paths");
              break;
          }
          break;
      }
    },
  },
};
