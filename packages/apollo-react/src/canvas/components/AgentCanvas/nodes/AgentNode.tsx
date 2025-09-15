import { memo, useMemo } from "react";
import { Position } from "@xyflow/react";
import type { NodeProps, Node } from "@xyflow/react";
import { ApIcon, ApCircularProgress } from "@uipath/portal-shell-react";
import { Icons } from "@uipath/uix-core";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import type { NewBaseNodeData, NewBaseNodeDisplayProps, HandleConfiguration } from "../../BaseNode/NewBaseNode.types";
import type { ButtonHandleConfig, HandleActionEvent } from "../../ButtonHandle/ButtonHandle";
import type { AgentNodeTranslations } from "../../../types";
import { ResourceNodeType } from "../AgentFlow.constants";

const { ConversationalAgentIcon, AutonomousAgentIcon } = Icons;

interface AgentNodeData extends NewBaseNodeData {
  name: string;
  description: string;
  definition: Record<string, unknown>;
  parentNodeId?: string;
  isConversational?: boolean;
}

interface AgentNodeProps extends NewBaseNodeDisplayProps {
  data: AgentNodeData;
  selected?: boolean;
  mode?: "design" | "view";
  hasModel?: boolean;
  hasContext?: boolean;
  hasEscalation?: boolean;
  hasTool?: boolean;
  hasMcp?: boolean;
  mcpEnabled?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddResource?: (type: "context" | "escalation" | "mcp" | "model" | "tool") => void;
  onArgumentsClick?: () => void;
  translations: AgentNodeTranslations;
}

const AgentNodeComponent = memo((props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    data,
    selected = false,
    mode = "design",
    hasModel = false,
    hasContext = false,
    hasEscalation = false,
    hasTool = false,
    hasMcp = false,
    mcpEnabled = true,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onAddResource,
    onArgumentsClick,
    translations,
    ...nodeProps
  } = props;

  const { name, definition } = data;
  const isConversational = (definition?.metadata as Record<string, unknown>)?.isConversational === true;

  const executionStatus = useMemo(() => {
    if (hasError) return "error";
    if (hasSuccess) return "success";
    if (hasRunning) return "running";
    return undefined;
  }, [hasError, hasSuccess, hasRunning]);

  const displayContext = mode === "design" || (mode === "view" && hasContext);
  const displayModel = mode === "design" || (mode === "view" && hasModel);
  const displayEscalation = mode === "design" || (mode === "view" && hasEscalation);
  const displayTool = mode === "design" || (mode === "view" && hasTool);
  const isMcpEnabled = mcpEnabled !== false;
  const displayMcp = (mode === "design" && isMcpEnabled) || (mode === "view" && !!hasMcp);

  // Create handle configurations
  const handleConfigurations: HandleConfiguration[] = useMemo(() => {
    const configs: HandleConfiguration[] = [];

    const topHandles: ButtonHandleConfig[] = [];

    if (displayContext) {
      topHandles.push({
        id: ResourceNodeType.Context,
        type: "source",
        handleType: "artifact",
        label: "Context",
        showButton: mode === "design",
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
        onAction: (_e: HandleActionEvent) => {
          onAddResource?.("context");
        },
      });
    }

    if (topHandles.length > 0) {
      configs.push({
        position: Position.Top,
        handles: topHandles,
        visible: true,
      });
    }

    // Bottom handles (Model, Escalation, Tool)
    const bottomHandles: ButtonHandleConfig[] = [];

    if (displayModel) {
      bottomHandles.push({
        id: ResourceNodeType.Model,
        type: "source",
        handleType: "artifact",
        label: "Model",
        showButton: false,
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
      });
    }

    if (displayEscalation) {
      bottomHandles.push({
        id: ResourceNodeType.Escalation,
        type: "source",
        handleType: "artifact",
        label: "Escalation",
        showButton: mode === "design",
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
        onAction: (_e: HandleActionEvent) => {
          onAddResource?.("escalation");
        },
      });
    }

    if (displayTool || displayMcp) {
      bottomHandles.push({
        id: ResourceNodeType.Tool,
        type: "source",
        handleType: "artifact",
        label: "Tool",
        showButton: mode === "design",
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
        onAction: (_e: HandleActionEvent) => {
          // Default to tool when both are available, or show the available option
          if (displayTool) {
            onAddResource?.("tool");
          } else if (displayMcp) {
            onAddResource?.("mcp");
          }
        },
      });
    }

    if (bottomHandles.length > 0) {
      configs.push({
        position: Position.Bottom,
        handles: bottomHandles,
        visible: true,
      });
    }

    return configs;
  }, [mode, displayContext, displayMcp, displayTool, displayModel, displayEscalation, onAddResource]);

  const statusAdornment = useMemo(() => {
    if (hasError) {
      return <ApIcon name="error" size="16px" color="var(--color-error-icon)" />;
    }
    if (hasSuccess && !hasError) {
      return <ApIcon name="check_circle" size="16px" color="var(--color-success-icon)" />;
    }
    if (hasRunning && !hasError && !hasSuccess) {
      return <ApCircularProgress size={20} />;
    }
    return undefined;
  }, [hasError, hasSuccess, hasRunning]);

  const agentIcon = useMemo(() => {
    if (isConversational) {
      return <ConversationalAgentIcon color="var(--color-foreground-de-emp)" w={32} h={32} />;
    }
    return <AutonomousAgentIcon color="var(--color-foreground-de-emp)" w={32} h={32} />;
  }, [isConversational]);

  const argumentsButton = useMemo(() => {
    if (mode === "design" && !isConversational && onArgumentsClick) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArgumentsClick();
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            backgroundColor: "var(--color-background-secondary)",
            color: "var(--color-foreground-de-emp)",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
            fontFamily: "inherit",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-selection-indicator)";
            e.currentTarget.style.color = "var(--color-background)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--color-background-secondary)";
            e.currentTarget.style.color = "var(--color-foreground-de-emp)";
          }}
        >
          <ApIcon name="data_object" size="16px" />
          {translations.arguments}
        </button>
      );
    }
    return undefined;
  }, [mode, isConversational, onArgumentsClick, translations.arguments]);

  // Convert to NewBaseNode props
  const newBaseNodeProps: NewBaseNodeDisplayProps = {
    executionStatus,
    icon: agentIcon,
    display: {
      label: name,
      subLabel: isConversational ? translations.conversationalAgent : translations.autonomousAgent,
      shape: "rectangle",
      background: "var(--color-background)",
      iconBackground: "var(--color-background-secondary)",
    },
    adornments: {
      topRight: statusAdornment,
      bottomLeft: argumentsButton,
    },
    handleConfigurations,
    showAddButton: mode === "design", // Show add buttons in design mode even when not selected
  };

  return <NewBaseNode {...nodeProps} data={{ ...newBaseNodeProps }} selected={selected} />;
});

AgentNodeComponent.displayName = "AgentNodeComponent";

const AgentNodeWrapper = (props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    data,
    mode,
    hasModel,
    hasContext,
    hasEscalation,
    hasTool,
    hasMcp,
    mcpEnabled,
    hasError,
    hasSuccess,
    hasRunning,
    onAddResource,
    onArgumentsClick,
    translations,
    ...nodeProps
  } = props;

  return (
    <AgentNodeComponent
      {...nodeProps}
      data={data}
      mode={mode}
      hasModel={hasModel}
      hasContext={hasContext}
      hasEscalation={hasEscalation}
      hasTool={hasTool}
      hasMcp={hasMcp}
      mcpEnabled={mcpEnabled}
      hasError={hasError}
      hasSuccess={hasSuccess}
      hasRunning={hasRunning}
      onAddResource={onAddResource}
      onArgumentsClick={onArgumentsClick}
      translations={translations}
    />
  );
};

export const AgentNodeElement = memo(AgentNodeWrapper);

export type { AgentNodeData, AgentNodeProps };
