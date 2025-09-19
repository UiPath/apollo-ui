import { memo, useMemo } from "react";
import styled from "@emotion/styled";
import { Position } from "@uipath/uix/xyflow/react";
import { FontVariantToken, Spacing } from "@uipath/apollo-core";
import { ApCircularProgress, ApIcon, ApTypography } from "@uipath/portal-shell-react";
import type { AgentFlowNodeData, AgentNodeTranslations } from "../../../types";
import { type ButtonHandleConfig, ButtonHandles, type HandleActionEvent } from "../../ButtonHandle/ButtonHandle";
import { Icons, Column, Row } from "@uipath/uix/core";
import { ResourceNodeType } from "../AgentFlow.constants";

const { ConversationalAgentIcon, AutonomousAgentIcon } = Icons;

interface AgentNodeElementProps {
  data: AgentFlowNodeData;
  selected?: boolean;
  mode?: "design" | "view";
  hasModel?: boolean;
  hasContext?: boolean;
  hasEscalation?: boolean;
  hasTool?: boolean;
  hasMcp?: boolean;
  // Whether the MCP feature is enabled. Used to show/hide the MCP handle in design mode
  mcpEnabled?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  onAddResource?: (type: "context" | "escalation" | "mcp" | "model" | "tool") => void;
  onArgumentsClick?: () => void;
  translations: AgentNodeTranslations;
}

const NodeContainer = styled.div<{ $borderColor: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 12px;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 2px solid ${(props) => props.$borderColor};
  width: 320px;
  height: 140px;
`;

const StatusIconContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
`;

const SubduedButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--color-background-secondary);
  color: var(--color-foreground-de-emp);
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--color-selection-indicator);
    color: var(--color-background);
  }
`;

export const AgentNodeElement = memo(
  ({
    data,
    selected,
    hasContext,
    hasEscalation,
    hasTool,
    hasModel,
    hasMcp,
    mcpEnabled,
    hasError = false,
    hasSuccess = false,
    hasRunning = false,
    mode,
    onAddResource,
    onArgumentsClick,
    translations,
  }: AgentNodeElementProps) => {
    const { name, definition } = data;
    const nodeId = `${data.definition?.name ?? ""}`;

    const borderColor = useMemo(() => {
      if (hasError) return "var(--color-error-icon)";
      if (hasSuccess) return "var(--color-success-icon)";
      if (hasRunning) return "var(--color-primary)";
      return selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";
    }, [selected, hasError, hasSuccess, hasRunning]);

    const displayContext = mode === "design" || (mode === "view" && hasContext);
    const displayModel = mode === "design" || (mode === "view" && hasModel);
    const displayEscalation = mode === "design" || (mode === "view" && hasEscalation);
    const displayTool = mode === "design" || (mode === "view" && hasTool);
    // Only show MCP handle in design mode when the feature is enabled (default enabled when undefined).
    // In view mode, only show when an MCP resource actually exists.
    const isMcpEnabled = mcpEnabled !== false;
    const displayMcp = (mode === "design" && isMcpEnabled) || (mode === "view" && !!hasMcp);
    const isConversational = (definition?.metadata as Record<string, unknown>)?.isConversational === true;

    const toolHandles: ButtonHandleConfig[] = useMemo(
      () => [
        {
          id: ResourceNodeType.Tool,
          type: "source",
          handleType: "artifact",
          label: "Tool",
          labelIcon: <ApIcon variant="outlined" name="home_repair_service" size="12px" color="var(--color-foreground-de-emp)" />,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.("tool");
          },
        },
      ],
      [mode, onAddResource]
    );

    const modelHandles: ButtonHandleConfig[] = useMemo(
      () => [
        {
          id: ResourceNodeType.Model,
          type: "source",
          handleType: "artifact",
          label: "Model",
          labelIcon: <ApIcon variant="outlined" name="chat" size="12px" color="var(--color-foreground-de-emp)" />,
          showButton: false,
          color: "var(--color-foreground-de-emp)",
        },
      ],
      []
    );

    const topHandles: ButtonHandleConfig[] = useMemo(() => {
      const handles: ButtonHandleConfig[] = [];

      // Add context handle if it should be displayed
      if (displayContext) {
        handles.push({
          id: ResourceNodeType.Context,
          type: "source",
          handleType: "artifact",
          label: "Context",
          labelIcon: <ApIcon variant="outlined" name="view_agenda" size="12px" color="var(--color-foreground-de-emp)" />,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.("context");
          },
        });
      }

      // Add MCP handle if it should be displayed
      if (displayMcp) {
        handles.push({
          id: ResourceNodeType.MCP,
          type: "source",
          handleType: "artifact",
          label: "MCP Server",
          labelIcon: <ApIcon name="dns" size="12px" color="var(--color-foreground-de-emp)" />,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.("mcp");
          },
        });
      }

      return handles;
    }, [mode, onAddResource, displayContext, displayMcp]);

    const bottomHandles: ButtonHandleConfig[] = useMemo(() => {
      const handles: ButtonHandleConfig[] = [];

      // Add escalation handle if it should be displayed
      if (displayEscalation) {
        handles.push({
          id: ResourceNodeType.Escalation,
          type: "source",
          handleType: "artifact",
          label: "Escalation",
          labelIcon: <ApIcon name="emoji_people" size="12px" color="var(--color-foreground-de-emp)" />,
          showButton: mode === "design",
          color: "var(--color-foreground-de-emp)",
          onAction: (_e: HandleActionEvent) => {
            onAddResource?.("escalation");
          },
        });
      }

      return handles;
    }, [mode, onAddResource, displayEscalation]);

    return (
      <div style={{ position: "relative" }}>
        <NodeContainer $borderColor={borderColor}>
          {/* Status icon in upper right */}
          {(hasError || hasSuccess || hasRunning) && (
            <StatusIconContainer>
              {hasError && <ApIcon name="error" size="16px" color="var(--color-error-icon)" />}
              {hasSuccess && !hasError && <ApIcon name="check_circle" size="16px" color="var(--color-success-icon)" />}
              {hasRunning && !hasError && !hasSuccess && <ApCircularProgress size={20} />}
            </StatusIconContainer>
          )}

          {/* main */}
          <Row align="center" gap={Spacing.SpacingBase}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
              }}
            >
              {/* TODO: Handle coded agents */}
              {isConversational && <ConversationalAgentIcon w={32} h={32} />}
              {!isConversational && <AutonomousAgentIcon w={32} h={32} />}
            </div>
            <Column overflow="hidden">
              <Row>
                <ApTypography
                  variant={FontVariantToken.fontSizeL}
                  color="var(--color-foreground)"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </ApTypography>
              </Row>
              <Row>
                <ApTypography
                  variant={FontVariantToken.fontSizeM}
                  color="var(--color-foreground-de-emp)"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {/* TODO: Handle coded agents */}
                  {isConversational ? translations.conversationalAgent : translations.autonomousAgent}
                </ApTypography>
              </Row>
            </Column>
          </Row>

          {/* buttons */}
          <Row gap={Spacing.SpacingBase}>
            {mode === "design" && !isConversational && (
              <SubduedButton
                onClick={(e) => {
                  e.stopPropagation();
                  onArgumentsClick?.();
                }}
              >
                <ApIcon name="data_object" size="16px" />
                {translations.arguments}
              </SubduedButton>
            )}
          </Row>
        </NodeContainer>

        <ButtonHandles nodeId={nodeId} handles={topHandles} position={Position.Top} selected={selected} visible={topHandles.length > 0} />

        <ButtonHandles nodeId={nodeId} handles={toolHandles} position={Position.Right} selected={selected} visible={displayTool} />

        <ButtonHandles nodeId={nodeId} handles={modelHandles} position={Position.Left} selected={selected} visible={displayModel} />

        <ButtonHandles
          nodeId={nodeId}
          handles={bottomHandles}
          position={Position.Bottom}
          selected={selected}
          visible={bottomHandles.length > 0}
        />
      </div>
    );
  }
);
AgentNodeElement.displayName = "AgentNodeElement";
