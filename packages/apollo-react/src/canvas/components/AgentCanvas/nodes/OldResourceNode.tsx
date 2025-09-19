import React, { memo, useCallback, useEffect, useMemo } from "react";
import styled from "@emotion/styled";
import { Position, useReactFlow } from "@uipath/uix-xyflow/react";
import type { NodeProps } from "@uipath/uix-xyflow/system";
import { Spacing } from "@uipath/apollo-core";
import { ApButton, ApCircularProgress, ApIcon, ApTooltip, ApTypography } from "@uipath/portal-shell-react";
import type { ButtonHandleConfig } from "../../ButtonHandle/ButtonHandle";
import { ButtonHandles } from "../../ButtonHandle/ButtonHandle";
import { NodeBoundaryIconsContainer } from "../components/NodeBoundaryIconsContainer";
import { Column, Icons } from "@uipath/uix-core";
import { useAgentFlowStore } from "../store/agent-flow-store";
import { type AgentFlowResourceNode, type AgentFlowResourceNodeData, ProjectType, type ResourceNodeTranslations } from "../../../types";
import { RESOURCE_NODE_ICON_WITH_SPACING_SIZE, RESOURCE_NODE_SIZE } from "../../../utils/auto-layout";
import { NODE_ID_DELIMITER } from "../../../utils/props-helpers";
import { NodeContextMenu, type NodeMenuDivider, type NodeMenuAction, type NodeMenuItem } from "../../NodeContextMenu";

const { AgentIcon, AnthropicIcon, ApiProject: ApiProjectIcon, GoogleIcon, OpenAIIcon } = Icons;

interface ResourceNodeElementProps extends NodeProps<AgentFlowResourceNode> {
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

const NodeWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const AvatarContainer = styled.div<{
  $selected: boolean;
  $isActive: boolean;
  $borderColor: string;
}>`
  width: ${RESOURCE_NODE_SIZE}px;
  height: ${RESOURCE_NODE_SIZE}px;
  background-color: var(--color-background);
  border: ${(props) => `2px solid ${props.$borderColor}`};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: ${(props) => (props.$isActive ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)")};
  overflow: ${(props) => (props.$selected || props.$isActive ? "visible" : "hidden")};
  cursor: pointer;
`;

const StatusIconContainer = styled.div`
  position: absolute;
  top: -20px;
  right: -30px;
  z-index: 2;
  background-color: var(--color-background);
  border-radius: 50%;
  padding: 8px;
`;

const ResourceIconWrapper = styled.div`
  width: 40px;
  height: 40px;
  color: var(--color-foreground);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const TextContainer = styled.div`
  text-align: center;
  white-space: nowrap;
`;

const ActiveResourceOuter = styled.div`
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2px dashed var(--color-selection-indicator);
  animation: rotateDash 12s linear infinite;
  pointer-events: none;

  @keyframes rotateDash {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const getLogoByModelName = (modelName: string): React.ReactElement | null => {
  const lowerModelName = modelName.toLowerCase();

  if (lowerModelName.includes("gpt") || lowerModelName.includes("text-embedding")) {
    return <OpenAIIcon w={48} h={48} />;
  }

  if (lowerModelName.includes("claude") || lowerModelName.includes("anthropic") || lowerModelName.includes("computer-use-preview")) {
    return <AnthropicIcon w={48} h={48} />;
  }

  if (lowerModelName.includes("gemini") || lowerModelName.includes("chat-bison")) {
    return <GoogleIcon w={48} h={48} />;
  }

  return <ApIcon name="chat" size="40px" />;
};

export const ResourceNodeElement = memo(
  ({
    data,
    selected,
    id,
    mode,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    onExpandResource,
    onCollapseResource,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToDefinition,
    translations,
  }: ResourceNodeElementProps) => {
    const { nodes, openMenuNodeId, setOpenMenuNodeId, deleteNode } = useAgentFlowStore();

    const isViewMode = mode === "view";
    const isDesignMode = mode === "design";
    const isActive = data.isActive ?? false;
    const hasBreakpoint = data.hasBreakpoint ?? false;
    const hasGuardrails = data.hasGuardrails ?? false;
    const isMenuOpen = openMenuNodeId === id;
    const isCurrentBreakpoint = data.isCurrentBreakpoint ?? false;

    const { getEdges } = useReactFlow();

    useEffect(() => {
      const handleDocumentClick = () => {
        if (isMenuOpen) {
          setOpenMenuNodeId(null);
        }
      };

      if (isMenuOpen) {
        document.addEventListener("click", handleDocumentClick);
        return () => {
          document.removeEventListener("click", handleDocumentClick);
        };
      }
    }, [isMenuOpen, setOpenMenuNodeId]);

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

    // Compute if the resource is expanded by checking if there are any nested nodes
    const isExpanded = useMemo(() => {
      if (!data.isExpandable) return false;
      // Check if there are any nodes that start with this resource's ID followed by the delimiter
      return nodes.some((node) => node.id.startsWith(`${id}${NODE_ID_DELIMITER}`));
    }, [id, nodes, data.isExpandable]);

    const connectedHandles = useMemo(() => {
      const edges = getEdges();

      const handles = new Set<string>();
      for (const edge of edges) {
        if (edge.source === id && edge.sourceHandle) {
          handles.add(edge.sourceHandle);
        }
        if (edge.target === id && edge.targetHandle) {
          handles.add(edge.targetHandle);
        }
      }

      return handles;
    }, [id, getEdges]);

    const resourceIcon = useMemo(() => {
      if (data.type === "tool") {
        if (data.projectType === ProjectType.Agent) {
          return <AgentIcon w={48} h={48} />;
        }
        if (data.projectType === ProjectType.Api) {
          return <ApiProjectIcon w={48} h={48} />;
        }
        if (!data.iconUrl) {
          return <ApIcon name="build" size="40px" />;
        }
        return <img src={data.iconUrl} alt={data.name} />;
      }
      if (data.type === "model") {
        if (data.iconUrl) {
          return <img src={data.iconUrl} alt={data.name} />;
        }

        return getLogoByModelName(data.name);
      }
      if (data.type === "context") return <ApIcon name="description" size="40px" />;
      if (data.type === "escalation") {
        return <ApIcon name="person" size="40px" />;
      }
      if (data.type === "mcp") {
        return <ApIcon name="dns" size="40px" />;
      }
    }, [data.iconUrl, data.name, data.type, data.projectType]);

    const borderColor = useMemo(() => {
      if (isCurrentBreakpoint && !isDesignMode) return "var(--color-warning-icon)";
      if (hasError) return "var(--color-error-icon)";
      if (hasSuccess) return "var(--color-success-icon)";
      if (hasRunning) return "var(--color-primary)";
      return selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";
    }, [selected, hasError, hasSuccess, hasRunning, isCurrentBreakpoint, isDesignMode]);

    const modelHandles: ButtonHandleConfig[] = useMemo(
      () => [
        {
          id: Position.Right,
          type: "source" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const toolLeftHandles = useMemo(
      () => [
        {
          id: Position.Left,
          type: "target" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: isCurrentBreakpoint ? "var(--color-warning-icon)" : "var(--color-foreground-de-emp)",
        },
      ],
      [isCurrentBreakpoint]
    );

    const toolRightHandles = useMemo(
      () => [
        {
          id: Position.Right,
          type: "source" as const,
          handleType: "artifact" as const,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const contextTopHandles = useMemo(
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

    const contextBottomHandles = useMemo(
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

    const mcpHandles = useMemo(
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

    const nodeMenuItems: NodeMenuItem[] = useMemo(() => {
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

    return (
      <Column align="center" position="relative">
        {/* resource circle */}
        <NodeWrapper>
          {/* resource circle */}
          <div style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
              {/* Status icon absolutely positioned at top-right of Avatar with more padding */}
              {(hasError || hasSuccess || hasRunning || isCurrentBreakpoint) && (
                <StatusIconContainer>
                  {(hasError || (data.errors && data.errors.length > 0)) && (
                    <ApIcon name="error" size="16px" color="var(--color-error-icon)" />
                  )}
                  {isCurrentBreakpoint && !hasError && <ApIcon name="pause_circle" size="16px" color="var(--color-warning-icon)" />}
                  {hasRunning && !hasError && !isCurrentBreakpoint && <ApCircularProgress size={13} />}
                  {hasSuccess && !hasError && !hasRunning && !isCurrentBreakpoint && (
                    <ApIcon name="check_circle" size="16px" color="var(--color-success-icon)" />
                  )}
                </StatusIconContainer>
              )}

              {/* TODO: Remove the `NodeBoundaryIconsContainer` component in lieu of BaseNode's adornments */}
              <NodeBoundaryIconsContainer
                iconSize={RESOURCE_NODE_ICON_WITH_SPACING_SIZE}
                nodeSize={RESOURCE_NODE_SIZE}
                bottomRight={{
                  component: <ApIcon variant="outlined" name="gpp_good" size="18px" color="var(--color-icon-default)" />,
                  visible: hasGuardrails,
                }}
                topLeft={{
                  component: <ApIcon name="stop_circle" size="18px" color="#cc3d45" />,
                  visible: hasBreakpoint,
                }}
              />

              <AvatarContainer
                data-testid="avatar"
                $selected={selected || false}
                $isActive={isViewMode && isActive}
                $borderColor={borderColor}
              >
                {/* rotating dashed border for active items in view mode */}
                {isViewMode && isActive && <ActiveResourceOuter />}

                {/* icon */}
                <ResourceIconWrapper>{resourceIcon}</ResourceIconWrapper>
              </AvatarContainer>
            </div>
          </div>
        </NodeWrapper>

        {/* Model handles */}
        {data.type === "model" && (
          <ButtonHandles nodeId={id} handles={modelHandles} position={Position.Right} selected={selected} visible={true} />
        )}

        {/* Tool handles */}
        {data.type === "tool" && (
          <>
            {(connectedHandles.has(Position.Left) || data.isExpandable) && (
              <ButtonHandles nodeId={id} handles={toolLeftHandles} position={Position.Left} selected={selected} visible={true} />
            )}
            {(connectedHandles.has(Position.Right) || data.isExpandable) && (
              <ButtonHandles nodeId={id} handles={toolRightHandles} position={Position.Right} selected={selected} visible={true} />
            )}
          </>
        )}

        {/* Context handles */}
        {data.type === "context" && (
          <>
            {connectedHandles.has(Position.Top) && (
              <ButtonHandles nodeId={id} handles={contextTopHandles} position={Position.Top} selected={selected} visible={true} />
            )}
            <ButtonHandles nodeId={id} handles={contextBottomHandles} position={Position.Bottom} selected={selected} visible={true} />
          </>
        )}

        {/* Escalation handles */}
        {data.type === "escalation" && (
          <ButtonHandles nodeId={id} handles={escalationHandles} position={Position.Top} selected={selected} visible={true} />
        )}

        {/* MCP handles */}
        {data.type === "mcp" && (
          <ButtonHandles nodeId={id} handles={mcpHandles} position={Position.Bottom} selected={selected} visible={true} />
        )}

        {/* text: positioned absolutely at the bottom to allow for the handles to be positioned correctly on the resource */}
        <TextContainer
          style={{
            position: "absolute",
            bottom: "0px",
            transform: "translateY(100%)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ApTooltip content={data.description} placement="bottom">
            <div
              style={{
                backgroundColor: "var(--color-background)",
                border: "1px solid transparent",
                borderRadius: Spacing.SpacingMicro,
                marginTop: Spacing.SpacingXs,
                padding: `0 ${Spacing.SpacingMicro}`,
              }}
            >
              <ApTypography color="var(--color-foreground)">{data.name}</ApTypography>
              {data.originalName && <ApTypography color="var(--color-foreground-de-emp)">({data.originalName})</ApTypography>}
            </div>
          </ApTooltip>
          {data.isExpandable && (
            <ApButton
              variant="tertiary"
              size="small"
              label={isExpanded ? translations?.collapse : translations?.expand}
              onClick={() => {
                if (isExpanded) {
                  onCollapseResource?.(id, data);
                } else if (!isExpanded) {
                  onExpandResource?.(id, data);
                }
              }}
            />
          )}
        </TextContainer>

        {/* node menu - show when menu is open OR when node is selected in design mode */}
        <NodeContextMenu menuItems={nodeMenuItems} isVisible={isDesignMode && selected} />
      </Column>
    );
  }
);
ResourceNodeElement.displayName = "ResourceNodeElement";
