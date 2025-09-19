import { memo, useCallback, useMemo } from "react";
import { ApCircularProgress, ApIcon } from "@uipath/portal-shell-react";
import { Icons, Row } from "@uipath/uix-core";
import { Position, type NodeProps } from "@uipath/uix-xyflow/react";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import { ProjectType, type AgentFlowResourceNode, type AgentFlowResourceNodeData, type ResourceNodeTranslations } from "../../../types";
import { type NodeMenuAction, type NodeMenuDivider, type NodeMenuItem } from "../../NodeContextMenu";
import { useAgentFlowStore } from "../store/agent-flow-store";
import { type ButtonHandleConfig } from "../../ButtonHandle";

interface ResourceNodeProps extends NodeProps<AgentFlowResourceNode> {
  mode?: "design" | "view";
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToDefinition?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
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
    onGoToDefinition,
    translations,
  }: ResourceNodeProps) => {
    const { nodes: _nodes, deleteNode } = useAgentFlowStore();

    const _isViewMode = mode === "view";
    const isDesignMode = mode === "design";
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

    const handleClickGoToDefinition = useCallback(() => {
      onGoToDefinition?.(id, data);
    }, [id, data, onGoToDefinition]);

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
          icon = <ApIcon name="dns" size="40px" />;
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

    // TODO: Think about how to handle representing colored state in the NewBaseNode
    const _borderColor = useMemo(() => {
      if (isCurrentBreakpoint && !isDesignMode) return "var(--color-warning-icon)";
      if (hasError) return "var(--color-error-icon)";
      if (hasSuccess) return "var(--color-success-icon)";
      if (hasRunning) return "var(--color-primary)";
      return selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";
    }, [selected, hasError, hasSuccess, hasRunning, isCurrentBreakpoint, isDesignMode]);

    const nodeMenuItems: NodeMenuItem[] = useMemo(() => {
      if (mode === "view" || data.type === "model") return [];

      const breakpointItem: NodeMenuAction = {
        id: "breakpoint",
        label: (hasBreakpoint ? translations?.removeBreakpoint : translations?.addBreakpoint) ?? "",
        onClick: hasBreakpoint ? handleClickRemoveBreakpoint : handleClickAddBreakpoint,
      };
      const guardrailItem: NodeMenuAction = {
        id: "guardrail",
        label: translations?.addGuardrail ?? "",
        onClick: handleClickAddGuardrail,
      };
      const goToDefinitionItem: NodeMenuAction = {
        id: "go-to-definition",
        label: translations?.goToDefinition ?? "",
        onClick: handleClickGoToDefinition,
      };
      const removeItem: NodeMenuAction = {
        id: "remove",
        label: translations?.remove ?? "",
        onClick: handleClickRemove,
      };
      const dividerItem: NodeMenuDivider = {
        type: "divider",
      };

      return [
        breakpointItem,
        ...(data.type === "tool" ? [guardrailItem] : []),
        dividerItem,
        ...(data.projectId ? [goToDefinitionItem] : []),
        removeItem,
      ];
    }, [
      mode,
      translations,
      data.type,
      data.projectId,
      hasBreakpoint,
      handleClickAddBreakpoint,
      handleClickAddGuardrail,
      handleClickRemove,
      handleClickGoToDefinition,
      handleClickRemoveBreakpoint,
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
          id: Position.Bottom,
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
          id: Position.Top,
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

    const statusAdornment = useMemo(() => {
      if (hasError || (data.errors && data.errors.length > 0)) {
        return <ApIcon name="error" size="14px" color="var(--color-error-icon)" />;
      }
      if (isCurrentBreakpoint && !hasError) {
        return <ApIcon name="pause_circle" size="14px" color="var(--color-warning-icon)" />;
      }
      if (hasRunning && !hasError && !isCurrentBreakpoint) {
        return <ApCircularProgress size={14} color="var(--color-primary)" />;
      }
      if (hasSuccess && !hasError && !hasRunning && !isCurrentBreakpoint) {
        return <ApIcon variant="normal" name="check_circle" size="14px" color="var(--color-success-icon)" />;
      }
      return undefined;
    }, [data.errors, hasError, hasRunning, hasSuccess, isCurrentBreakpoint]);

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
          position: Position.Bottom,
          handles: contextHandles,
          visible: data.type === "context",
        },
        {
          position: Position.Top,
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
        icon={resourceIcon}
        display={{
          iconBackground: "var(--color-background-secondary)",
          label: data.name,
          subLabel: data.originalName,
          labelBackgroundColor: "var(--color-background-secondary)",
          shape: "circle",
        }}
        menuItems={nodeMenuItems}
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
