import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import type { Edge, EdgeProps, Node, NodeProps } from "@xyflow/react";
import {
  BaseEdge,
  getSimpleBezierPath,
  Panel,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { FontVariantToken, Spacing } from "@uipath/apollo-core";
import { ApCircularProgress, ApIcon, ApTypography } from "@uipath/portal-shell-react";
import { Icons, Column, Row } from "@uipath/uix/core";
import type { BaseCanvasRef } from "../BaseCanvas";
import { BaseCanvas, NODE_DIMENSIONS } from "../BaseCanvas";
import { ButtonHandles } from "../ButtonHandle";
import { CanvasPositionControls } from "../CanvasPositionControls";
import type { CodedAgentNodeTranslations } from "../../types";
import { DefaultCodedAgentNodeTranslations } from "../../types";
import { d3HierarchyLayout, type LayoutDirection } from "../../utils/coded-agents/d3-layout";
import { mermaidToReactFlow } from "../../utils/coded-agents/mermaid-parser";

const LAYOUT_SPACING = [110, 80] as [number, number]; // Horizontal and vertical spacing for layout

const CodedAgentEdge = memo(
  ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, animated }: EdgeProps) => {
    const [edgePath] = getSimpleBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const strokeColor = animated ? "var(--color-primary)" : "var(--color-foreground-de-emp)";

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 1,
          transition: "stroke 0.2s ease-in-out",
        }}
      />
    );
  }
);

const CenteredDiv = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NodeContainer = memo(styled.div<{ $borderColor: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 12px;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 2px solid ${(props) => props.$borderColor};
  width: ${NODE_DIMENSIONS.codedAgent.width}px;
  min-height: ${NODE_DIMENSIONS.codedAgent.height}px;
`);

const ResourceAvatar = memo(styled.div<{ $borderColor: string; $isActive?: boolean }>`
  width: ${NODE_DIMENSIONS.resource.width}px;
  height: ${NODE_DIMENSIONS.resource.height}px;
  background-color: var(--color-background);
  border: ${(props) => `2px solid ${props.$borderColor}`};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  cursor: pointer;
  color: ${(props) => (props.$isActive ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)")};
`);

const StatusIconContainer = memo(styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
`);

const TextContainer = memo(styled.div`
  position: absolute;
  bottom: 0;
  transform: translateY(100%);
  text-align: center;
  white-space: nowrap;
`);

const FlowNodeSquare = memo(styled.div<{ $borderColor: string }>`
  width: ${NODE_DIMENSIONS.resource.width}px;
  height: ${NODE_DIMENSIONS.resource.height}px;
  border-radius: 8px;
  background-color: var(--color-background);
  border: 2px solid ${(props) => props.$borderColor};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`);

interface CodedNodeData {
  label: string;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
}

const leftTargetHandle = [
  {
    id: "left",
    type: "target" as const,
    handleType: "artifact" as const,
    showButton: false,
  },
];

const rightSourceHandle = [
  {
    id: "right",
    type: "source" as const,
    handleType: "artifact" as const,
    showButton: false,
  },
];

const rightOutputHandle = [
  {
    id: "right",
    type: "source" as const,
    handleType: "output" as const,
    showButton: false,
  },
];

const leftInputHandle = [
  {
    id: "left",
    type: "target" as const,
    handleType: "input" as const,
    showButton: false,
  },
];

const createCodedAgentNodeWrapper = (translations: CodedAgentNodeTranslations = DefaultCodedAgentNodeTranslations) => {
  return memo(({ data, selected }: NodeProps) => {
    const nodeData = data as unknown as CodedNodeData;

    const borderColor = useMemo(() => {
      if (nodeData.hasError) return "var(--color-error-icon)";
      if (nodeData.hasSuccess) return "var(--color-success-icon)";
      if (nodeData.hasRunning) return "var(--color-primary)";
      return selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";
    }, [selected, nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

    return (
      <div style={{ position: "relative" }}>
        <NodeContainer $borderColor={borderColor}>
          {/* Status icon in upper right */}
          {(nodeData.hasError || nodeData.hasSuccess || nodeData.hasRunning) && (
            <StatusIconContainer>
              {nodeData.hasError && <ApIcon name="error" size="16px" color="var(--color-error-icon)" />}
              {nodeData.hasSuccess && !nodeData.hasError && <ApIcon name="check_circle" size="16px" color="var(--color-success-icon)" />}
              {nodeData.hasRunning && !nodeData.hasError && !nodeData.hasSuccess && <ApCircularProgress size={20} />}
            </StatusIconContainer>
          )}

          {/* main */}
          <Row align="center" gap={Spacing.SpacingBase}>
            <div
              style={{
                width: 40,
                height: 40,
                alignSelf: "start",
              }}
            >
              <Icons.CodedAgentIcon w={40} h={40} />
            </div>
            <Column overflow="hidden">
              <ApTypography
                variant={FontVariantToken.fontSizeLBold}
                color="var(--color-foreground)"
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {nodeData.label}
              </ApTypography>
              <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
                {translations.codedAgentStep}
              </ApTypography>
            </Column>
          </Row>
        </NodeContainer>

        {/* Connection handles */}
        <ButtonHandles nodeId={"nodeId"} handles={leftTargetHandle} position={Position.Left} selected={selected} visible={true} />
        <ButtonHandles nodeId={"nodeId"} handles={rightSourceHandle} position={Position.Right} selected={selected} visible={true} />
      </div>
    );
  });
};

const CodedResourceNodeElement = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CodedNodeData & { type?: string };
  const label = nodeData.label.toLowerCase();

  const borderColor = useMemo(() => {
    if (nodeData.hasError) return "var(--color-error-icon)";
    if (nodeData.hasSuccess) return "var(--color-success-icon)";
    if (nodeData.hasRunning) return "var(--color-primary)";
    return selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";
  }, [selected, nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

  // Determine icon based on label content or type
  const resourceIcon = useMemo(() => {
    const resourceType = nodeData.type || "";

    if (resourceType === "tool" || label.includes("tool") || label.includes("function")) {
      return <ApIcon name="build" size="40px" />;
    }
    if (resourceType === "context" || label.includes("context") || label.includes("knowledge")) {
      return <ApIcon name="account_tree" size="40px" />;
    }
    if (resourceType === "escalation" || label.includes("escalation") || label.includes("human")) {
      return <ApIcon name="person" size="40px" />;
    }
    return <ApIcon name="chat" size="40px" />;
  }, [label, nodeData.type]);

  return (
    <Column align="center" position="relative">
      <div style={{ position: "relative" }}>
        {/* Status icon absolutely positioned */}
        {(nodeData.hasError || nodeData.hasSuccess || nodeData.hasRunning) && (
          <StatusIconContainer style={{ top: "-20px", right: "-30px", zIndex: 2 }}>
            {nodeData.hasError && <ApIcon name="error" size="16px" color="var(--color-error-icon)" />}
            {nodeData.hasSuccess && !nodeData.hasError && <ApIcon name="check_circle" size="16px" color="var(--color-success-icon)" />}
            {nodeData.hasRunning && !nodeData.hasError && !nodeData.hasSuccess && <ApCircularProgress size={13} />}
          </StatusIconContainer>
        )}

        <ResourceAvatar $borderColor={borderColor} $isActive={selected}>
          {resourceIcon}
        </ResourceAvatar>
      </div>

      <TextContainer>
        <ApTypography color="var(--color-foreground-de-emp)">{nodeData.label}</ApTypography>
      </TextContainer>

      {/* Connection handles */}
      <ButtonHandles nodeId={"nodeId"} handles={leftTargetHandle} position={Position.Left} selected={selected} visible={true} />
      <ButtonHandles nodeId={"nodeId"} handles={rightSourceHandle} position={Position.Right} selected={selected} visible={true} />
    </Column>
  );
});

const CodedFlowNodeElement = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as CodedNodeData;
  const isStart = nodeData.label.toLowerCase().includes("start");
  const isEnd = nodeData.label.toLowerCase().includes("end");
  const borderColor = selected ? "var(--color-selection-indicator)" : "var(--color-foreground-de-emp)";

  if (isStart || isEnd) {
    return (
      <Column align="center" position="relative">
        <FlowNodeSquare $borderColor={borderColor}>
          <ApIcon variant="outlined" name={isStart ? "circle" : "trip_origin"} size="40px" color={borderColor} />
        </FlowNodeSquare>

        {/* Label below the square */}
        <TextContainer>
          <ApTypography variant={FontVariantToken.fontSizeS} color="var(--color-foreground-de-emp)">
            {nodeData.label}
          </ApTypography>
        </TextContainer>

        {isStart && (
          <ButtonHandles nodeId={"nodeId"} handles={rightOutputHandle} position={Position.Right} selected={selected} visible={true} />
        )}
        {isEnd && <ButtonHandles nodeId={"nodeId"} handles={leftInputHandle} position={Position.Left} selected={selected} visible={true} />}
      </Column>
    );
  }

  return (
    <NodeContainer
      $borderColor={borderColor}
      style={{ width: `${NODE_DIMENSIONS.flow.width}px`, height: `${NODE_DIMENSIONS.flow.height}px` }}
    >
      <Column align="center" justify="center" style={{ height: "100%" }}>
        <ApTypography color="var(--color-foreground)" style={{ fontSize: "14px", textAlign: "center" }}>
          {nodeData.label}
        </ApTypography>
      </Column>

      {/* Connection handles */}
      <ButtonHandles nodeId={"nodeId"} handles={leftTargetHandle} position={Position.Left} selected={selected} visible={true} />
      <ButtonHandles nodeId={"nodeId"} handles={rightSourceHandle} position={Position.Right} selected={selected} visible={true} />
    </NodeContainer>
  );
});

export interface CodedAgentFlowProps {
  mermaidText: string;
  layoutDirection?: LayoutDirection;
  agentNodeTranslations?: CodedAgentNodeTranslations;
  canvasRef?: React.Ref<BaseCanvasRef>;
  mode?: "view" | "readonly";
}

const edgeTypes = {
  default: CodedAgentEdge,
};

const CodedAgentFlowInner = (props: CodedAgentFlowProps): JSX.Element => {
  const reactFlowInstance = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges] = useEdgesState([] as Edge[]);

  const [isLoading, setIsLoading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const edgesRef = useRef<Edge[]>([]);

  const agentNodeTranslations = useMemo(
    () => props.agentNodeTranslations ?? DefaultCodedAgentNodeTranslations,
    [props.agentNodeTranslations]
  );

  const nodeTypes = useMemo(
    () => ({
      agent: createCodedAgentNodeWrapper(agentNodeTranslations),
      resource: CodedResourceNodeElement,
      flow: CodedFlowNodeElement,
    }),
    [agentNodeTranslations]
  );

  const layoutDirection = useMemo(() => props.layoutDirection || "LR", [props.layoutDirection]);

  // Handle mermaid text parsing
  useEffect(() => {
    const processData = async () => {
      // Reset initialization state when mermaid text changes
      hasInitialized.current = false;

      // If mermaid text is provided, parse it
      if (props.mermaidText && props.mermaidText.length > 0) {
        setIsLoading(true);
        setParseError(null);

        try {
          const parsedResult = await mermaidToReactFlow(props.mermaidText);

          // Check if parsing resulted in no nodes - this indicates a parse error
          if (parsedResult.nodes.length === 0) {
            throw new Error("Invalid mermaid syntax");
          }

          // Store the edges and direction, but don't apply layout yet
          edgesRef.current = parsedResult.edges;

          // Set nodes with initial positions for React Flow to measure them
          setNodes(parsedResult.nodes);
          setEdges(parsedResult.edges);
        } catch (error) {
          setParseError((error as Error).message);
          setNodes([]);
          setEdges([]);
        } finally {
          setIsLoading(false);
        }
      }
      // No data provided
      else {
        setNodes([]);
        setEdges([]);
      }
    };

    processData();
  }, [props.mermaidText, setEdges, setNodes]);

  // Auto-arrange handler that applies d3 layout
  const autoLayout = useCallback(async () => {
    // Don't run if already initialized
    if (hasInitialized.current) {
      return;
    }

    // Get fresh nodes from ReactFlow instance
    const currentNodes = reactFlowInstance.getNodes();

    if (currentNodes.length === 0) {
      return;
    }

    try {
      const { nodes: layoutNodes } = await d3HierarchyLayout(currentNodes, edgesRef.current, {
        direction: layoutDirection,
        spacing: LAYOUT_SPACING,
      });

      // Update nodes with their final layout positions
      setNodes(layoutNodes);

      // Mark as initialized only after successful layout
      hasInitialized.current = true;
    } catch {
      // Don't mark as initialized on failure so it can retry
    }
  }, [layoutDirection, setNodes, reactFlowInstance]);

  if (parseError) {
    return (
      <CenteredDiv>
        <ApTypography color="var(--color-error)">Error: {parseError}</ApTypography>
      </CenteredDiv>
    );
  }

  if (isLoading) {
    return (
      <CenteredDiv>
        <ApTypography color="var(--color-foreground)">Loading...</ApTypography>
      </CenteredDiv>
    );
  }

  if (nodes.length === 0) {
    return (
      <CenteredDiv>
        <ApTypography color="var(--color-foreground)">{agentNodeTranslations.noDataToDisplay}</ApTypography>
      </CenteredDiv>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", touchAction: "none" }}>
      <BaseCanvas
        ref={props.canvasRef}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        mode={props.mode || "view"}
        initialAutoLayout={autoLayout}
        onNodesChange={onNodesChange}
        deleteKeyCode={[]} // Disable delete key for Coded agents
      >
        <Panel position="top-left">
          <Row align="center" gap={Spacing.SpacingXs}>
            <Icons.AgentIcon w={20} h={20} />
            <ApTypography variant={FontVariantToken.fontSizeSBold} color="var(--color-foreground)">
              Coded Agent
            </ApTypography>
          </Row>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls />
        </Panel>
      </BaseCanvas>
    </div>
  );
};

export const CodedAgentFlow = (props: CodedAgentFlowProps): JSX.Element => {
  return (
    <ReactFlowProvider>
      <CodedAgentFlowInner {...props} />
    </ReactFlowProvider>
  );
};
