import { Fragment, memo, useCallback, useMemo } from "react";
import { ApIcon } from "@uipath/portal-shell-react";
import { Icons, Row } from "@uipath/uix/core";
import { Position, type NodeProps } from "@uipath/uix/xyflow/react";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import {
  type AgentFlowResourceNode,
  type AgentFlowResourceNodeData,
  type ResourceNodeTranslations,
  type SuggestionTranslations,
  DefaultSuggestionTranslations,
} from "../../../types";
import { useAgentFlowStore, useEdges } from "../store/agent-flow-store";
import { ExecutionStatusIcon } from "../../ExecutionStatusIcon/ExecutionStatusIcon";
import type { NodeToolbarConfig, ToolbarAction } from "../../NodeToolbar/NodeToolbar.types";
import { ToolResourceIcon } from "../components/ToolResourceIcon";
import type { NodeAdornment } from "../../BaseNode/NewBaseNode.types";

interface ResourceNodeProps extends NodeProps<AgentFlowResourceNode> {
  mode?: "design" | "view";
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onEnable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onDisable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveResource?: (resourceId: string) => void;
  translations?: ResourceNodeTranslations;
  suggestionTranslations?: SuggestionTranslations;
  /** Supports versioning so we can show/hide individual suggestion level actions if supported by the integration */
  suggestionGroupVersion?: string;
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
    onEnable,
    onDisable,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToSource,
    translations,
    suggestionTranslations,
    suggestionGroupVersion,
  }: ResourceNodeProps) => {
    const { nodes: _nodes, deleteNode, actOnSuggestion } = useAgentFlowStore();
    const edges = useEdges();

    // Find which handle position has a connection for this node
    const connectedHandlePosition = useMemo(() => {
      const nodeEdge = edges.find((e) => e.target === id);
      return nodeEdge?.targetHandle as Position | undefined;
    }, [edges, id]);

    const displayTooltips = mode === "design";
    const hasBreakpoint = data.hasBreakpoint ?? false;
    const hasGuardrails = data.hasGuardrails ?? false;
    const isCurrentBreakpoint = data.isCurrentBreakpoint ?? false;
    const isDisabled = data.isDisabled ?? false;
    const isSuggestion = data.isSuggestion ?? false;
    const suggestionId = data.suggestionId;
    const suggestionType = isSuggestion ? data.suggestionType : undefined;
    const suggestTranslations = suggestionTranslations ?? DefaultSuggestionTranslations;

    const handleClickEnable = useCallback(() => {
      onEnable?.(id, data);
    }, [id, data, onEnable]);

    const handleClickDisable = useCallback(() => {
      onDisable?.(id, data);
    }, [id, data, onDisable]);

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
      deleteNode(id);
    }, [id, deleteNode]);

    const handleActOnSuggestion = useCallback(
      (suggestionId: string, action: "accept" | "reject") => {
        actOnSuggestion(suggestionId, action);
      },
      [actOnSuggestion]
    );

    const resourceIcon = useMemo(() => {
      let icon: React.ReactNode | undefined;
      switch (data.type) {
        case "context":
          icon = <ApIcon name="description" size="40px" />;
          break;
        case "escalation":
          icon = <ApIcon name="person" size="40px" />;
          break;
        case "memorySpace":
          icon = <Icons.MemoryIcon w={40} h={40} />;
          break;
        case "mcp":
          icon = <Icons.McpIcon w={40} h={40} />;
          break;
        case "tool":
          icon = <ToolResourceIcon size={48} tool={data} />;
          break;
        default:
          icon = undefined;
          break;
      }
      return <Row style={{ color: "var(--uix-canvas-foreground-de-emp)" }}>{icon}</Row>;
    }, [data]);

    const executionStatus = useMemo(() => {
      if (isCurrentBreakpoint) return "Paused";
      if (hasError) return "Failed";
      if (hasSuccess) return "Completed";
      if (hasRunning) return "InProgress";
      return undefined;
    }, [hasError, hasSuccess, hasRunning, isCurrentBreakpoint]);

    const toolbarConfig = useMemo((): NodeToolbarConfig | undefined => {
      if (mode === "view") {
        return undefined;
      }

      // If this is a standalone placeholder (not yet converted to permanent), disable toolbar
      // Standalone placeholders have suggestionId but isSuggestion is false
      if (!isSuggestion && suggestionId && data.isPlaceholder) {
        return undefined;
      }

      // If this is a suggestion, show accept/reject actions only if version is not "0.0.1"
      if (isSuggestion && suggestionId) {
        if (suggestionGroupVersion === "0.0.1") return undefined;
        const rejectAction: ToolbarAction = {
          id: "reject-suggestion",
          icon: "close",
          label: suggestTranslations.reject,
          disabled: false,
          onAction: () => handleActOnSuggestion(suggestionId, "reject"),
        };

        const acceptAction: ToolbarAction = {
          id: "accept-suggestion",
          icon: "check",
          label: suggestTranslations.accept,
          disabled: false,
          onAction: () => handleActOnSuggestion(suggestionId, "accept"),
        };

        return {
          actions: [rejectAction, acceptAction],
          overflowActions: [],
          overflowLabel: "",
          position: "top",
          align: "center",
        };
      }

      const toggleBreakpointAction: ToolbarAction = {
        id: "toggle-breakpoint",
        icon: undefined,
        label: (hasBreakpoint ? translations?.removeBreakpoint : translations?.addBreakpoint) ?? "",
        disabled: false,
        onAction: hasBreakpoint ? handleClickRemoveBreakpoint : handleClickAddBreakpoint,
      };

      const addGuardrailAction: ToolbarAction = {
        id: "add-guardrail",
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

      const toggleEnabledAction: ToolbarAction = {
        id: "toggle-enabled",
        icon: undefined,
        label: (isDisabled ? translations?.enable : translations?.disable) ?? "",
        disabled: false,
        onAction: isDisabled ? handleClickEnable : handleClickDisable,
      };

      const separator: ToolbarAction = {
        id: "separator",
        icon: undefined,
        label: undefined,
        disabled: false,
        onAction: () => {},
      };

      const actions: ToolbarAction[] = [removeAction];
      const overflowActions: ToolbarAction[] = [
        ...(data.type !== "memorySpace" ? [toggleBreakpointAction] : []),
        ...(data.type === "tool" ? [addGuardrailAction] : []),
        ...(data.projectId ? [goToSourceAction] : []),
        ...(data.type === "tool" ? [separator, toggleEnabledAction] : []),
      ];

      return {
        actions,
        overflowActions,
        overflowLabel: translations?.moreOptions ?? "",
        position: "top",
        align: "center",
      };
    }, [
      mode,
      data.projectId,
      data.type,
      data.isPlaceholder,
      hasBreakpoint,
      isDisabled,
      isSuggestion,
      suggestionId,
      suggestionGroupVersion,
      handleClickEnable,
      handleClickDisable,
      handleClickRemoveBreakpoint,
      handleClickAddBreakpoint,
      translations,
      handleClickAddGuardrail,
      handleClickGoToSource,
      handleClickRemove,
      handleActOnSuggestion,
      suggestTranslations,
    ]);

    const toolTopHandles = useMemo(
      () => [
        {
          id: Position.Top,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--uix-canvas-foreground-de-emp)",
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
          color: "var(--uix-canvas-foreground-de-emp)",
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
          color: "var(--uix-canvas-foreground-de-emp)",
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
          color: "var(--uix-canvas-foreground-de-emp)",
        },
      ],
      []
    );

    const memoryHandles = useMemo(
      () => [
        {
          id: Position.Bottom,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--uix-canvas-foreground-de-emp)",
        },
      ],
      []
    );

    const breakpointAdornment = useMemo((): NodeAdornment => {
      if (!hasBreakpoint) return { icon: undefined };
      return { icon: <ApIcon variant="normal" name="circle" size="14px" color="#cc3d45" /> };
    }, [hasBreakpoint]);

    const statusAdornment = useMemo((): NodeAdornment => {
      return {
        icon: <ExecutionStatusIcon status={executionStatus} size={16} />,
        tooltip:
          displayTooltips && executionStatus === "Failed"
            ? data.errors?.map((error) => <Fragment key={error.value}>- {error.label}</Fragment>)
            : undefined,
      };
    }, [displayTooltips, executionStatus, data.errors]);

    const guardrailsAdornment = useMemo((): NodeAdornment => {
      if (!hasGuardrails) return { icon: undefined };
      return {
        icon: <ApIcon variant="outlined" name="gpp_good" size="18px" color="var(--uix-canvas-icon-default)" />,
        tooltip: displayTooltips ? (translations?.guardrailsApplied ?? "") : undefined,
      };
    }, [displayTooltips, hasGuardrails, translations]);

    const suggestionAdornment = useMemo((): NodeAdornment => {
      if (!isSuggestion) return { icon: undefined };
      let iconName = "swap_horizontal_circle";
      let color = "var(--uix-canvas-warning-icon)";

      if (suggestionType === "add") {
        iconName = "add_circle";
        color = "var(--uix-canvas-success-icon)";
      } else if (suggestionType === "delete") {
        iconName = "remove_circle";
        color = "var(--uix-canvas-error-icon)";
      }

      return {
        icon: <ApIcon variant="normal" name={iconName} size="18px" color={color} />,
        tooltip: undefined,
      };
    }, [isSuggestion, suggestionType]);

    const handleConfigurations = useMemo(
      () => [
        {
          position: Position.Top,
          handles: toolTopHandles,
          visible: (data.type === "tool" || data.type === "mcp") && connectedHandlePosition === Position.Top,
        },
        ...(data.isExpandable
          ? [
              {
                position: Position.Bottom,
                handles: toolBottomHandles,
                visible: (data.type === "tool" || data.type === "mcp") && connectedHandlePosition === Position.Bottom,
              },
            ]
          : []),
        {
          position: Position.Top,
          handles: contextHandles,
          visible: data.type === "context" && connectedHandlePosition === Position.Top,
        },
        {
          position: Position.Bottom,
          handles: escalationHandles,
          visible: data.type === "escalation" && connectedHandlePosition === Position.Bottom,
        },
        {
          position: Position.Bottom,
          handles: memoryHandles,
          visible: data.type === "memorySpace" && connectedHandlePosition === Position.Bottom,
        },
      ],
      [
        data.type,
        data.isExpandable,
        connectedHandlePosition,
        toolTopHandles,
        toolBottomHandles,
        contextHandles,
        escalationHandles,
        memoryHandles,
      ]
    );

    return (
      <NewBaseNode
        data={{}}
        handleConfigurations={handleConfigurations}
        disabled={isDisabled}
        executionStatus={executionStatus}
        suggestionType={suggestionType}
        icon={resourceIcon}
        display={{
          iconBackground: "var(--uix-canvas-background-secondary)",
          label: data.name,
          subLabel: data.originalName,
          labelTooltip: displayTooltips ? data.description : undefined,
          labelBackgroundColor: "var(--uix-canvas-background-secondary)",
          shape: "circle",
        }}
        toolbarConfig={toolbarConfig}
        adornments={{
          topLeft: breakpointAdornment,
          topRight: statusAdornment,
          bottomLeft: suggestionAdornment,
          bottomRight: guardrailsAdornment,
        }}
        type={id}
        id={id}
        draggable={false}
        dragging={false}
        zIndex={0}
        selectable={true}
        deletable={!isSuggestion}
        selected={selected}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    );
  }
);
