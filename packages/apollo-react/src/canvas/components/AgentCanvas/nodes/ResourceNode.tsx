import { memo, useCallback, useMemo } from "react";
import { ApIcon } from "@uipath/portal-shell-react";
import { Icons, Row } from "@uipath/uix/core";
import { Position, type NodeProps } from "@uipath/uix/xyflow/react";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import { ProjectType, type AgentFlowResourceNode, type AgentFlowResourceNodeData, type ResourceNodeTranslations } from "../../../types";
import { useAgentFlowStore } from "../store/agent-flow-store";
import { type ButtonHandleConfig } from "../../ButtonHandle";
import { ExecutionStatusIcon } from "../../ExecutionStatusIcon/ExecutionStatusIcon";
import type { NodeToolbarConfig, ToolbarAction } from "../../NodeToolbar/NodeToolbar.types";

interface ResourceNodeProps extends NodeProps<AgentFlowResourceNode> {
  mode?: "design" | "view";
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveResource?: (resourceId: string) => void;
  translations?: ResourceNodeTranslations;
}

export const ResourceNode = memo(
  ({
    data,
    selected,
    id,
    mode,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToSource,
    translations,
  }: ResourceNodeProps) => {
    const { nodes: _nodes, deleteNode } = useAgentFlowStore();

    const _isViewMode = mode === "view";
    const _isDesignMode = mode === "design";
    const _isActive = data.isActive ?? false;
    const hasBreakpoint = data.hasBreakpoint ?? false;
    const hasGuardrails = data.hasGuardrails ?? false;
    const isCurrentBreakpoint = data.isCurrentBreakpoint ?? false;

    const handleClickAddBreakpoint = useCallback(() => {
      onAddBreakpoint?.(id, data);
    }, [id, data, onAddBreakpoint]);

    const handleClickRemoveBreakpoint = useCallback(() => {
      onRemoveBreakpoint?.(id, data);
    }, [id, data, onRemoveBreakpoint]);

    const handleClickAddGuardrail = useCallback(() => {
      onAddGuardrail?.(id, data);
    }, [id, data, onAddGuardrail]);

    const handleClickGoToSource = useCallback(() => {
      onGoToSource?.(id, data);
    }, [id, data, onGoToSource]);

    const handleClickRemove = useCallback(() => {
      if (data.type !== "model") {
        deleteNode(id);
      }
    }, [id, deleteNode, data.type]);

    const getModelIcon = (modelName: string) => {
      const modelNameNormalized = modelName.toLowerCase();

      if (modelNameNormalized.includes("gpt") || modelNameNormalized.includes("text-embedding")) {
        return <Icons.OpenAIIcon w={48} h={48} />;
      }

      if (
        modelNameNormalized.includes("claude") ||
        modelNameNormalized.includes("anthropic") ||
        modelNameNormalized.includes("computer-use-preview")
      ) {
        return <Icons.AnthropicIcon w={48} h={48} />;
      }

      if (modelNameNormalized.includes("gemini") || modelNameNormalized.includes("chat-bison")) {
        return <Icons.GoogleIcon w={48} h={48} />;
      }

      return <ApIcon color="var(--color-icon)" name="chat" size="40px" />;
    };

    const getToolIcon = (name: string, projectType?: string, iconUrl?: string) => {
      if (projectType === ProjectType.Agent) {
        return <Icons.AgentIcon w={48} h={48} />;
      }
      if (projectType === ProjectType.Api) {
        return <Icons.ApiProject w={48} h={48} />;
      }
      if (!iconUrl) {
        return <ApIcon name="build" size="40px" />;
      }
      return <img src={iconUrl} alt={name} />;
    };

    const resourceIcon = useMemo(() => {
      let icon: React.ReactNode | undefined;
      switch (data.type) {
        case "context":
          icon = <ApIcon name="description" size="40px" />;
          break;
        case "escalation":
          icon = <ApIcon name="person" size="40px" />;
          break;
        case "mcp":
          icon = <Icons.McpIcon w={40} h={40} />;
          break;
        case "model":
          icon = getModelIcon(data.name);
          break;
        case "tool":
          icon = getToolIcon(data.name, data.projectType, data.iconUrl);
          break;
        default:
          icon = undefined;
          break;
      }
      return <Row style={{ color: "var(--color-foreground-de-emp)" }}>{icon}</Row>;
    }, [data.iconUrl, data.name, data.type, data.projectType]);

    const executionStatus = useMemo(() => {
      if (isCurrentBreakpoint) return "Paused";
      if (hasError) return "Failed";
      if (hasSuccess) return "Completed";
      if (hasRunning) return "InProgress";
      return undefined;
    }, [hasError, hasSuccess, hasRunning, isCurrentBreakpoint]);

    const toolbarConfig: NodeToolbarConfig | undefined = useMemo(() => {
      if (mode === "view" || data.type === "model") return undefined;

      const breakpointAction: ToolbarAction = {
        id: "breakpoint",
        icon: undefined,
        label: (hasBreakpoint ? translations?.removeBreakpoint : translations?.addBreakpoint) ?? "",
        disabled: false,
        onAction: hasBreakpoint ? handleClickRemoveBreakpoint : handleClickAddBreakpoint,
      };

      const guardrailAction: ToolbarAction = {
        id: "guardrail",
        icon: undefined,
        label: translations?.addGuardrail ?? "",
        disabled: false,
        onAction: handleClickAddGuardrail,
      };

      const goToSourceAction: ToolbarAction = {
        id: "go-to-source",
        icon: undefined,
        label: translations?.goToSource ?? "",
        disabled: false,
        onAction: handleClickGoToSource,
      };

      const removeAction: ToolbarAction = {
        id: "remove",
        icon: "delete",
        label: translations?.remove ?? "",
        disabled: false,
        onAction: handleClickRemove,
      };

      const actions: ToolbarAction[] = [removeAction];
      const overflowActions: ToolbarAction[] = [
        breakpointAction,
        ...(data.type === "tool" ? [guardrailAction] : []),
        ...(data.projectId ? [goToSourceAction] : []),
      ];

      return {
        actions,
        overflowActions,
        position: "top",
        align: "center",
      };
    }, [
      mode,
      data.projectId,
      data.type,
      hasBreakpoint,
      handleClickRemoveBreakpoint,
      handleClickAddBreakpoint,
      translations,
      handleClickAddGuardrail,
      handleClickGoToSource,
      handleClickRemove,
    ]);

    const modelHandles: ButtonHandleConfig[] = useMemo(
      () => [
        {
          id: Position.Top,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const toolTopHandles = useMemo(
      () => [
        {
          id: Position.Top,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const toolBottomHandles = useMemo(
      () => [
        {
          id: Position.Bottom,
          type: "source" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const contextHandles = useMemo(
      () => [
        {
          id: Position.Top,
          type: "source" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const escalationHandles = useMemo(
      () => [
        {
          id: Position.Bottom,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const breakpointAdornment = useMemo(() => {
      if (hasBreakpoint) {
        return <ApIcon variant="normal" name="circle" size="14px" color="#cc3d45" />;
      }
      return undefined;
    }, [hasBreakpoint]);

    const statusAdornment = <ExecutionStatusIcon status={executionStatus} size={16} />;

    const guardrailsAdornment = useMemo(() => {
      if (hasGuardrails) {
        return <ApIcon variant="outlined" name="gpp_good" size="18px" color="var(--color-icon-default)" />;
      }
      return undefined;
    }, [hasGuardrails]);

    const handleConfigurations = useMemo(
      () => [
        {
          position: Position.Top,
          handles: modelHandles,
          visible: data.type === "model",
        },
        {
          position: Position.Top,
          handles: toolTopHandles,
          visible: data.type === "tool" || data.type === "mcp",
        },
        ...(data.isExpandable
          ? [
              {
                position: Position.Bottom,
                handles: toolBottomHandles,
                visible: data.type === "tool" || data.type === "mcp",
              },
            ]
          : []),
        {
          position: Position.Top,
          handles: contextHandles,
          visible: data.type === "context",
        },
        {
          position: Position.Bottom,
          handles: escalationHandles,
          visible: data.type === "escalation",
        },
      ],
      [data.type, data.isExpandable, modelHandles, toolTopHandles, toolBottomHandles, contextHandles, escalationHandles]
    );

    return (
      <NewBaseNode
        data={{}}
        handleConfigurations={handleConfigurations}
        executionStatus={executionStatus}
        icon={resourceIcon}
        display={{
          iconBackground: "var(--color-background-secondary)",
          label: data.name,
          subLabel: data.originalName,
          labelBackgroundColor: "var(--color-background-secondary)",
          shape: "circle",
        }}
        toolbarConfig={toolbarConfig}
        adornments={{
          topLeft: breakpointAdornment,
          topRight: statusAdornment,
          bottomRight: guardrailsAdornment,
        }}
        type={id}
        id={id}
        draggable={false}
        dragging={false}
        zIndex={0}
        selectable={true}
        deletable={true}
        selected={selected}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );
  }
);
