import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import styled from '@emotion/styled';
import { FontVariantToken, Spacing } from '@uipath/apollo-core';
import * as Icons from '@uipath/apollo-react/canvas/icons';
import { Row } from '@uipath/apollo-react/canvas/layouts';
import type { Edge, EdgeProps, Node, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  BaseEdge,
  getSimpleBezierPath,
  Panel,
  Position,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { ApCircularProgress, ApIcon, ApTypography } from '@uipath/apollo-react/material';

import type { CanvasTranslations, CodedAgentNodeTranslations } from '../../types';
import { DefaultCanvasTranslations, DefaultCodedAgentNodeTranslations } from '../../types';
import { d3HierarchyLayout, type LayoutDirection } from '../../utils/coded-agents/d3-layout';
import { mermaidToReactFlow } from '../../utils/coded-agents/mermaid-parser';
import type { BaseCanvasRef } from '../BaseCanvas';
import { BaseCanvas } from '../BaseCanvas';
import { NewBaseNode } from '../BaseNode/NewBaseNode';
import type { NewBaseNodeData } from '../BaseNode/NewBaseNode.types';
import { CanvasPositionControls } from '../CanvasPositionControls';

const LAYOUT_SPACING = [110, 80] as [number, number]; // Horizontal and vertical spacing for layout

const CodedAgentEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    animated,
  }: EdgeProps) => {
    const [edgePath] = getSimpleBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const strokeColor = animated
      ? 'var(--uix-canvas-primary)'
      : 'var(--uix-canvas-foreground-de-emp)';

    return (
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: 1,
          transition: 'stroke 0.2s ease-in-out',
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

const TextContainer = memo(styled.div`
  position: absolute;
  bottom: 0;
  transform: translateY(100%);
  text-align: center;
  white-space: nowrap;
`);

interface CodedNodeData extends NewBaseNodeData {
  label: string;
  hasError?: boolean;
  hasSuccess?: boolean;
  hasRunning?: boolean;
  type?: string;
}

const leftTargetHandle = [
  {
    id: 'left',
    type: 'target' as const,
    handleType: 'artifact' as const,
    showButton: false,
  },
];

const rightSourceHandle = [
  {
    id: 'right',
    type: 'source' as const,
    handleType: 'artifact' as const,
    showButton: false,
  },
];

const rightOutputHandle = [
  {
    id: 'right',
    type: 'source' as const,
    handleType: 'output' as const,
    showButton: false,
  },
];

const leftInputHandle = [
  {
    id: 'left',
    type: 'target' as const,
    handleType: 'input' as const,
    showButton: false,
  },
];

const createCodedAgentNodeWrapper = (
  translations: CodedAgentNodeTranslations = DefaultCodedAgentNodeTranslations
) => {
  return memo(({ data, selected, id }: NodeProps) => {
    const nodeData = data as unknown as CodedNodeData;

    const executionStatus = useMemo(() => {
      if (nodeData.hasError) return 'Failed';
      if (nodeData.hasSuccess) return 'Success';
      if (nodeData.hasRunning) return 'Running';
      return undefined;
    }, [nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

    const statusAdornment = useMemo(() => {
      if (nodeData.hasError)
        return <ApIcon name="error" size="16px" color="var(--uix-canvas-error-icon)" />;
      if (nodeData.hasSuccess && !nodeData.hasError)
        return <ApIcon name="check_circle" size="16px" color="var(--uix-canvas-success-icon)" />;
      if (nodeData.hasRunning && !nodeData.hasError && !nodeData.hasSuccess)
        return <ApCircularProgress size={20} />;
      return undefined;
    }, [nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

    return (
      <NewBaseNode
        {...({ id, selected } as any)}
        data={nodeData}
        executionStatus={executionStatus}
        icon={<Icons.CodedAgentIcon w={40} h={40} />}
        display={{
          label: nodeData.label,
          subLabel: translations.codedAgentStep,
          shape: 'rectangle',
        }}
        adornments={{
          topRight: statusAdornment,
        }}
        handleConfigurations={[
          { position: Position.Left, handles: leftTargetHandle, visible: true },
          { position: Position.Right, handles: rightSourceHandle, visible: true },
        ]}
      />
    );
  });
};

const CodedResourceNodeElement = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as CodedNodeData & { type?: string };
  const label = nodeData.label.toLowerCase();

  const executionStatus = useMemo(() => {
    if (nodeData.hasError) return 'Failed';
    if (nodeData.hasSuccess) return 'Success';
    if (nodeData.hasRunning) return 'Running';
    return undefined;
  }, [nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

  // Determine icon based on label content or type
  const resourceIcon = useMemo(() => {
    const resourceType = nodeData.type || '';

    if (resourceType === 'tool' || label.includes('tool') || label.includes('function')) {
      return <ApIcon name="build" size="40px" />;
    }
    if (resourceType === 'context' || label.includes('context') || label.includes('knowledge')) {
      return <ApIcon name="account_tree" size="40px" />;
    }
    if (resourceType === 'escalation' || label.includes('escalation') || label.includes('human')) {
      return <ApIcon name="person" size="40px" />;
    }
    return <ApIcon name="chat" size="40px" />;
  }, [label, nodeData.type]);

  const statusAdornment = useMemo(() => {
    if (nodeData.hasError)
      return <ApIcon name="error" size="16px" color="var(--uix-canvas-error-icon)" />;
    if (nodeData.hasSuccess && !nodeData.hasError)
      return <ApIcon name="check_circle" size="16px" color="var(--uix-canvas-success-icon)" />;
    if (nodeData.hasRunning && !nodeData.hasError && !nodeData.hasSuccess)
      return <ApCircularProgress size={13} />;
    return undefined;
  }, [nodeData.hasError, nodeData.hasSuccess, nodeData.hasRunning]);

  return (
    <div style={{ position: 'relative' }}>
      <NewBaseNode
        {...({ id, selected } as any)}
        data={nodeData}
        executionStatus={executionStatus}
        icon={resourceIcon}
        display={{
          shape: 'circle',
        }}
        adornments={{
          topRight: statusAdornment,
        }}
        handleConfigurations={[
          { position: Position.Left, handles: leftTargetHandle, visible: true },
          { position: Position.Right, handles: rightSourceHandle, visible: true },
        ]}
      />
      <TextContainer>
        <ApTypography color="var(--uix-canvas-foreground-de-emp)">{nodeData.label}</ApTypography>
      </TextContainer>
    </div>
  );
});

const CodedFlowNodeElement = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as CodedNodeData;
  const isStart = nodeData.label.toLowerCase().includes('start');
  const isEnd = nodeData.label.toLowerCase().includes('end');

  if (isStart || isEnd) {
    const handleConfigs = isStart
      ? [{ position: Position.Right, handles: rightOutputHandle, visible: true }]
      : [{ position: Position.Left, handles: leftInputHandle, visible: true }];

    return (
      <div style={{ position: 'relative' }}>
        <NewBaseNode
          {...({ id, selected } as any)}
          data={nodeData}
          icon={<ApIcon variant="outlined" name={isStart ? 'circle' : 'trip_origin'} size="40px" />}
          display={{
            shape: 'square',
          }}
          handleConfigurations={handleConfigs}
        />
        <TextContainer>
          <ApTypography
            variant={FontVariantToken.fontSizeS}
            color="var(--uix-canvas-foreground-de-emp)"
          >
            {nodeData.label}
          </ApTypography>
        </TextContainer>
      </div>
    );
  }

  return (
    <NewBaseNode
      {...({ id, selected } as any)}
      data={nodeData}
      display={{
        label: nodeData.label,
        shape: 'rectangle',
      }}
      handleConfigurations={[
        { position: Position.Left, handles: leftTargetHandle, visible: true },
        { position: Position.Right, handles: rightSourceHandle, visible: true },
      ]}
    />
  );
});

export interface CodedAgentFlowProps {
  mermaidText: string;
  layoutDirection?: LayoutDirection;
  agentNodeTranslations?: CodedAgentNodeTranslations;
  canvasTranslations?: CanvasTranslations;
  canvasRef?: React.Ref<BaseCanvasRef>;
  mode?: 'view' | 'readonly';
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

  const layoutDirection = useMemo(() => props.layoutDirection || 'LR', [props.layoutDirection]);

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
            throw new Error('Invalid mermaid syntax');
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
        <ApTypography color="var(--uix-canvas-error)">Error: {parseError}</ApTypography>
      </CenteredDiv>
    );
  }

  if (isLoading) {
    return (
      <CenteredDiv>
        <ApTypography color="var(--uix-canvas-foreground)">Loading...</ApTypography>
      </CenteredDiv>
    );
  }

  if (nodes.length === 0) {
    return (
      <CenteredDiv>
        <ApTypography color="var(--uix-canvas-foreground)">
          {agentNodeTranslations.noDataToDisplay}
        </ApTypography>
      </CenteredDiv>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', touchAction: 'none' }}>
      <BaseCanvas
        ref={props.canvasRef}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        mode={props.mode || 'view'}
        initialAutoLayout={autoLayout}
        onNodesChange={onNodesChange}
        deleteKeyCode={[]} // Disable delete key for Coded agents
      >
        <Panel position="top-left">
          <Row align="center" gap={Spacing.SpacingXs}>
            <Icons.AgentIcon w={20} h={20} />
            <ApTypography
              variant={FontVariantToken.fontSizeSBold}
              color="var(--uix-canvas-foreground)"
            >
              Coded Agent
            </ApTypography>
          </Row>
        </Panel>
        <Panel position="bottom-right">
          <CanvasPositionControls
            translations={props.canvasTranslations ?? DefaultCanvasTranslations}
            showOrganize={false}
          />
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
