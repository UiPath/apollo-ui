import { memo, useMemo } from "react";
import { Position } from "@uipath/uix/xyflow/react";
import type { NodeProps, Node } from "@uipath/uix/xyflow/react";
import { Icons } from "@uipath/uix/core";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import type { NewBaseNodeData, NewBaseNodeDisplayProps, HandleConfiguration } from "../../BaseNode/NewBaseNode.types";
import type { ButtonHandleConfig, HandleActionEvent } from "../../ButtonHandle/ButtonHandle";
import type { AgentNodeTranslations } from "../../../types";
import { ResourceNodeType } from "../AgentFlow.constants";
import { ExecutionStatusIcon } from "../../ExecutionStatusIcon/ExecutionStatusIcon";

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
  hasMemory?: boolean;
  hasContext?: boolean;
  hasEscalation?: boolean;
  hasTool?: boolean;
  hasMcp?: boolean;
  mcpEnabled?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddResource?: (type: "context" | "escalation" | "mcp" | "model" | "tool" | "memory") => void;
  translations: AgentNodeTranslations;
}

const AgentNodeComponent = memo((props: NodeProps<Node<AgentNodeData>> & AgentNodeProps) => {
  const {
    data,
    selected = false,
    mode = "design",
    hasModel = false,
    hasMemory = false,
    hasContext = false,
    hasEscalation = false,
    hasTool = false,
    hasMcp = false,
    mcpEnabled = true,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onAddResource,
    translations,
    ...nodeProps
  } = props;

  const { name, definition } = data;
  const isConversational = (definition?.metadata as Record<string, unknown>)?.isConversational === true;

  const executionStatus = useMemo(() => {
    if (hasError) return "Failed";
    if (hasSuccess) return "Completed";
    if (hasRunning) return "InProgress";
    return undefined;
  }, [hasError, hasSuccess, hasRunning]);

  const displayModel = mode === "design" || (mode === "view" && hasModel);
  const displayMemory = hasMemory; // Simply show memory if it exists, regardless of mode
  const displayContext = mode === "design" || (mode === "view" && hasContext);
  const displayEscalation = mode === "design" || (mode === "view" && hasEscalation);
  const displayTool = mode === "design" || (mode === "view" && hasTool);
  const isMcpEnabled = mcpEnabled !== false;
  const displayMcp = (mode === "design" && isMcpEnabled) || (mode === "view" && !!hasMcp);

  // Create handle configurations
  const handleConfigurations: HandleConfiguration[] = useMemo(() => {
    const configs: HandleConfiguration[] = [];

    // Top handles (Context)
    const topHandles: ButtonHandleConfig[] = [];
    // Bottom handles (Model, Escalation, Tool)
    const bottomHandles: ButtonHandleConfig[] = [];

    if (displayMemory) {
      topHandles.push({
        id: ResourceNodeType.Memory,
        type: "source",
        handleType: "artifact",
        label: translations.memory,
        showButton: false, // Memory handle shouldn't be actionable
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
        visible: displayMemory,
      });
    }

    if (displayEscalation) {
      topHandles.push({
        id: ResourceNodeType.Escalation,
        type: "source",
        handleType: "artifact",
        label: translations.escalations,
        showButton: mode === "design",
        color: "var(--color-foreground-de-emp)",
        labelBackgroundColor: "var(--color-background-secondary)",
        visible: displayEscalation,
        onAction: (_e: HandleActionEvent) => {
          onAddResource?.("escalation");
        },
      });
    }

    if (topHandles.length) {
      configs.push({
        position: Position.Top,
        handles: topHandles,
        visible: true,
      });
    }

    if (displayModel || displayContext || displayTool || displayMcp) {
      bottomHandles.push(
        {
          id: ResourceNodeType.Model,
          type: "source",
          handleType: "artifact",
          label: translations.model,
          showButton: false, // Model handle shouldn't be actionable
          color: "var(--color-foreground-de-emp)",
          labelBackgroundColor: "var(--color-background-secondary)",
          visible: displayModel,
        },
        {
          id: ResourceNodeType.Context,
          type: "source",
          handleType: "artifact",
          label: translations.context,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          labelBackgroundColor: "var(--color-background-secondary)",
          visible: displayContext,
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.("context");
          },
        },
        {
          id: ResourceNodeType.Tool,
          type: "source",
          handleType: "artifact",
          label: translations.tools,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          labelBackgroundColor: "var(--color-background-secondary)",
          visible: displayTool || displayMcp,
          onAction: (_e: HandleActionEvent) => {
            // Default to tool when both are available, or show the available option
            if (displayTool) {
              onAddResource?.("tool");
            } else if (displayMcp) {
              onAddResource?.("mcp");
            }
          },
        }
      );
      configs.push({
        position: Position.Bottom,
        handles: bottomHandles,
        visible: true,
      });
    }

    return configs;
  }, [mode, displayContext, displayMemory, displayMcp, displayTool, displayModel, displayEscalation, onAddResource, translations]);

  const agentIcon = useMemo(() => {
    if (isConversational) {
      return <ConversationalAgentIcon color="var(--color-foreground-de-emp)" w={32} h={32} />;
    }
    return <AutonomousAgentIcon color="var(--color-foreground-de-emp)" w={32} h={32} />;
  }, [isConversational]);

  const statusAdornment = <ExecutionStatusIcon status={executionStatus} size={16} />;

  const shouldShowAddButtonFn = (opts: { showAddButton: boolean; selected: boolean }) => {
    return opts.showAddButton || opts.selected;
  };

  return (
    <NewBaseNode
      {...nodeProps}
      executionStatus={executionStatus}
      icon={agentIcon}
      display={{
        label: name,
        subLabel: isConversational ? translations.conversationalAgent : translations.autonomousAgent,
        shape: "rectangle",
        background: "var(--color-background)",
        iconBackground: "var(--color-background-secondary)",
      }}
      handleConfigurations={handleConfigurations}
      showAddButton={mode === "design"} // Show add buttons in design mode even when not selected
      selected={selected}
      shouldShowAddButtonFn={shouldShowAddButtonFn}
      adornments={{ topRight: statusAdornment }}
    />
  );
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
      translations={translations}
    />
  );
};

export const AgentNodeElement = memo(AgentNodeWrapper);

export type { AgentNodeData, AgentNodeProps };
