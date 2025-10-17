import { Fragment, memo, useCallback, useMemo } from "react";
import { ApIcon } from "@uipath/portal-shell-react";
import { Icons, Row } from "@uipath/uix/core";
import { Position, type NodeProps } from "@uipath/uix/xyflow/react";
import { NewBaseNode } from "../../BaseNode/NewBaseNode";
import { type AgentFlowResourceNode, type AgentFlowResourceNodeData, type ResourceNodeTranslations } from "../../../types";
import { useAgentFlowStore } from "../store/agent-flow-store";
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
  }: ResourceNodeProps) => {
    const { nodes: _nodes, deleteNode } = useAgentFlowStore();

    const displayTooltips = mode === "design";
    const hasBreakpoint = data.hasBreakpoint ?? false;
    const hasGuardrails = data.hasGuardrails ?? false;
    const isCurrentBreakpoint = data.isCurrentBreakpoint ?? false;
    const isDisabled = data.isDisabled ?? false;

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

    const resourceIcon = useMemo(() => {
      let icon: React.ReactNode | undefined;
      switch (data.type) {
        case "context":
          icon = <ApIcon name="description" size="40px" />;
          break;
        case "escalation":
          icon = <ApIcon name="person" size="40px" />;
          break;
        case "memory":
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
      return <Row style={{ color: "var(--color-foreground-de-emp)" }}>{icon}</Row>;
    }, [data]);

    const executionStatus = useMemo(() => {
      if (isCurrentBreakpoint) return "Paused";
      if (hasError) return "Failed";
      if (hasSuccess) return "Completed";
      if (hasRunning) return "InProgress";
      return undefined;
    }, [hasError, hasSuccess, hasRunning, isCurrentBreakpoint]);

    const toolbarConfig = useMemo((): NodeToolbarConfig | undefined => {
      if (mode === "view" || data.type === "memory") {
        return undefined;
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
        toggleBreakpointAction,
        ...(data.type === "tool" ? [addGuardrailAction] : []),
        ...(data.projectId ? [goToSourceAction] : []),
        ...(data.type === "tool" ? [separator, toggleEnabledAction] : []),
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
      isDisabled,
      handleClickEnable,
      handleClickDisable,
      handleClickRemoveBreakpoint,
      handleClickAddBreakpoint,
      translations,
      handleClickAddGuardrail,
      handleClickGoToSource,
      handleClickRemove,
    ]);

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

    const memoryHandles = useMemo(
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

    const breakpointAdornment = useMemo((): NodeAdornment => {
      if (hasBreakpoint) {
        return { icon: <ApIcon variant="normal" name="circle" size="14px" color="#cc3d45" /> };
      }
      return { icon: undefined };
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
      if (hasGuardrails) {
        return {
          icon: <ApIcon variant="outlined" name="gpp_good" size="18px" color="var(--color-icon-default)" />,
          tooltip: displayTooltips ? (translations?.guardrailsApplied ?? "") : undefined,
        };
      }
      return { icon: undefined };
    }, [displayTooltips, hasGuardrails, translations]);

    const handleConfigurations = useMemo(
      () => [
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
        {
          position: Position.Bottom,
          handles: memoryHandles,
          visible: data.type === "memory",
        },
      ],
      [data.type, data.isExpandable, toolTopHandles, toolBottomHandles, contextHandles, escalationHandles, memoryHandles]
    );

    return (
      <NewBaseNode
        data={{}}
        handleConfigurations={handleConfigurations}
        disabled={isDisabled}
        executionStatus={executionStatus}
        icon={resourceIcon}
        display={{
          iconBackground: "var(--color-background-secondary)",
          label: data.name,
          subLabel: data.originalName,
          labelTooltip: displayTooltips ? data.description : undefined,
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
