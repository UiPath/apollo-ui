import React, { memo, useCallback, useEffect, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { Panel, Position, useReactFlow } from "@uipath/uix/xyflow/react";
import type { NodeProps } from "@uipath/uix/xyflow/system";
import { BaseCanvas, FLOW_LAYOUT } from "../../components/BaseCanvas";
import { CanvasPositionControls } from "../../components/CanvasPositionControls";

import { TimelinePlayer } from "./components/TimelinePlayer";
import { Edge } from "./edges/Edge";
import { Column } from "@uipath/uix/core";
import { AgentNodeElement } from "./nodes/AgentNode";
import { ResourceNode } from "./nodes/ResourceNode";
import { AgentFlowProvider, useAgentFlowStore } from "./store/agent-flow-store";
import {
  type AgentFlowCustomEdge,
  type AgentFlowCustomNode,
  type AgentFlowNode,
  type AgentFlowProps,
  type AgentFlowResourceNode,
  type AgentNodeTranslations,
  DefaultAgentNodeTranslations,
  DefaultCanvasTranslations,
  isAgentFlowResourceNode,
  isAgentFlowAgentNode,
  type AgentFlowResourceNodeData,
  DefaultResourceNodeTranslations,
  type ResourceNodeTranslations,
} from "../../types";
import { hasAgentRunning } from "../../utils/props-helpers";
import { ResourceNodeType, ResourceNodeTypeToPosition } from "./AgentFlow.constants";
import { RESOURCE_NODE_SIZE } from "../../utils/auto-layout";

const edgeTypes = {
  default: Edge,
};

// AgentFlow-specific fit view options with reduced padding
const AGENT_FLOW_FIT_VIEW_OPTIONS = {
  padding: 0.3,
  duration: 300,
};

/**
 * Adds virtual spacing nodes to AgentFlow for balanced fit view.
 * Only affects AgentFlow - does not impact other canvas components.
 */
const addVirtualSpacingNodes = (nodes: AgentFlowCustomNode[], agentNode: AgentFlowCustomNode): AgentFlowCustomNode[] => {
  const agentWidth = agentNode.measured?.width ?? agentNode.width ?? 320;
  const agentHeight = agentNode.measured?.height ?? agentNode.height ?? 140;

  // Check which positions have actual nodes
  const hasTopNodes = nodes.some(
    (node) =>
      isAgentFlowResourceNode(node) &&
      node.data.parentNodeId === agentNode.id &&
      ResourceNodeTypeToPosition[node.data.type] === Position.Top
  );

  const hasBottomNodes = nodes.some(
    (node) =>
      isAgentFlowResourceNode(node) &&
      node.data.parentNodeId === agentNode.id &&
      ResourceNodeTypeToPosition[node.data.type] === Position.Bottom
  );

  const virtualNodes: AgentFlowCustomNode[] = [];

  // Add virtual top node if no escalations exist
  if (!hasTopNodes) {
    virtualNodes.push({
      id: "__virtual_top__",
      type: "resource",
      position: {
        x: agentNode.position.x + agentWidth / 2 - RESOURCE_NODE_SIZE / 2,
        y: agentNode.position.y - FLOW_LAYOUT.groupDistanceVertical - RESOURCE_NODE_SIZE,
      },
      data: {
        type: ResourceNodeType.Escalation,
        name: "__virtual__",
        description: "",
        parentNodeId: agentNode.id,
        isVirtual: true,
      },
      width: RESOURCE_NODE_SIZE,
      height: RESOURCE_NODE_SIZE,
      style: {
        opacity: 0,
        pointerEvents: "none",
      },
      draggable: false,
      selectable: false,
    } as AgentFlowCustomNode);
  }

  // Add virtual bottom node if no model/context/tools exist
  if (!hasBottomNodes) {
    virtualNodes.push({
      id: "__virtual_bottom__",
      type: "resource",
      position: {
        x: agentNode.position.x + agentWidth / 2 - RESOURCE_NODE_SIZE / 2,
        y: agentNode.position.y + agentHeight + FLOW_LAYOUT.groupDistanceVertical,
      },
      data: {
        type: ResourceNodeType.Model,
        name: "__virtual__",
        description: "",
        parentNodeId: agentNode.id,
        isVirtual: true,
      },
      width: RESOURCE_NODE_SIZE,
      height: RESOURCE_NODE_SIZE,
      style: {
        opacity: 0,
        pointerEvents: "none",
      },
      draggable: false,
      selectable: false,
    } as AgentFlowCustomNode);
  }

  return [...nodes, ...virtualNodes];
};

// agent node wrapper
const createAgentNodeWrapper = (handlers: {
  onAddResource?: (type: "context" | "escalation" | "mcp" | "model" | "tool") => void;
  onArgumentsClick?: () => void;
  translations?: AgentNodeTranslations;
  enableMcpTools?: boolean;
}) => {
  return (props: NodeProps<AgentFlowNode>) => {
    const { props: storeProps, nodes } = useAgentFlowStore();

    const hasModel = nodes.some(
      (node) => isAgentFlowResourceNode(node) && node.data.type === "model" && node.data.parentNodeId === props.id
    );

    const hasContext = nodes.some(
      (node) => isAgentFlowResourceNode(node) && node.data.type === "context" && node.data.parentNodeId === props.id
    );

    const hasEscalation = nodes.some(
      (node) => isAgentFlowResourceNode(node) && node.data.type === "escalation" && node.data.parentNodeId === props.id
    );
    const hasTool = nodes.some((node) => isAgentFlowResourceNode(node) && node.data.type === "tool" && node.data.parentNodeId === props.id);

    const hasMcp =
      handlers.enableMcpTools !== false &&
      nodes.some((node) => isAgentFlowResourceNode(node) && node.data.type === "mcp" && node.data.parentNodeId === props.id);
    // Check if agent itself is running OR if any of its resources are running
    const agentRunning = hasAgentRunning(storeProps.spans);
    const resourceRunning = nodes.some(
      (node) => isAgentFlowResourceNode(node) && node.data.parentNodeId === props.id && node.data.hasRunning
    );
    const hasRunning = agentRunning || resourceRunning;

    const hasError =
      !hasRunning && nodes.some((node) => isAgentFlowResourceNode(node) && node.data.parentNodeId === props.id && node.data.hasError);
    const hasSuccess =
      !hasRunning && nodes.some((node) => isAgentFlowResourceNode(node) && node.data.parentNodeId === props.id && node.data.hasSuccess);

    return (
      <AgentNodeElement
        {...props}
        hasContext={hasContext}
        hasEscalation={hasEscalation}
        hasTool={hasTool}
        hasMcp={hasMcp}
        mcpEnabled={handlers.enableMcpTools !== false}
        mode={storeProps.mode}
        hasModel={hasModel}
        hasError={hasError}
        hasSuccess={hasSuccess}
        hasRunning={hasRunning}
        onAddResource={handlers.onAddResource}
        onArgumentsClick={handlers.onArgumentsClick}
        translations={handlers.translations ?? DefaultAgentNodeTranslations}
      />
    );
  };
};

// resource node wrapper
const createResourceNodeWrapper = (opts: {
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  translations?: ResourceNodeTranslations;
}) => {
  return (props: NodeProps<AgentFlowResourceNode>) => {
    const { props: storeProps, deleteNode } = useAgentFlowStore();

    return (
      <ResourceNode
        {...props}
        mode={storeProps.mode}
        hasError={props.data.hasError}
        hasSuccess={props.data.hasSuccess}
        hasRunning={props.data.hasRunning}
        onAddBreakpoint={opts.onAddBreakpoint}
        onRemoveBreakpoint={opts.onRemoveBreakpoint}
        onAddGuardrail={opts.onAddGuardrail}
        onGoToSource={opts.onGoToSource}
        onRemoveResource={deleteNode}
        onExpandResource={opts.onExpandResource}
        onCollapseResource={opts.onCollapseResource}
        translations={opts.translations ?? DefaultResourceNodeTranslations}
      />
    );
  };
};

const AgentFlowInner = memo(
  ({
    children,
    mode,
    spans,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToSource,
    onAddModel,
    onAddResource,
    onSelectResource,
    setSpanForSelectedNode,
    getNodeFromSelectedSpan,
    onExpandResource,
    onCollapseResource,
    agentNodeTranslations,
    resourceNodeTranslations,
    canvasTranslations,
    enableTimelinePlayer,
    onArgumentsClick,
    canvasRef,
    enableMcpTools,
  }: PropsWithChildren<AgentFlowProps>) => {
    const {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      autoArrange,
      updateNode,
      reorderNodes,
      insertNodeAfter,
      setDragPreview,
      setSelectedNodeId,
      selectedNodeId,
      clearDragAndAutoArrange,
      setDragging,
      expandAgent,
      collapseAgent,
    } = useAgentFlowStore();

    const { fitView } = useReactFlow();

    const nodeTypes = useMemo(() => {
      const handleAddResource = (type: "context" | "escalation" | "mcp" | "model" | "tool") => {
        if (type === "model") {
          onAddModel?.();
        } else {
          onAddResource?.(type);
        }
      };

      return {
        agent: createAgentNodeWrapper({
          onAddResource: handleAddResource,
          translations: agentNodeTranslations,
          onArgumentsClick,
          enableMcpTools,
        }),
        resource: createResourceNodeWrapper({
          onAddBreakpoint,
          onRemoveBreakpoint,
          onAddGuardrail,
          onGoToSource,
          onExpandResource,
          onCollapseResource,
          translations: resourceNodeTranslations,
        }),
      };
    }, [
      onAddBreakpoint,
      onRemoveBreakpoint,
      onAddGuardrail,
      onGoToSource,
      onAddModel,
      onAddResource,
      agentNodeTranslations,
      resourceNodeTranslations,
      onArgumentsClick,
      onExpandResource,
      onCollapseResource,
      enableMcpTools,
    ]);

    const handlePaneClick = useCallback(() => {
      setSelectedNodeId(null);
      onSelectResource?.("pane");
    }, [onSelectResource, setSelectedNodeId]);

    const handleNodeClick = useCallback(
      (_event: React.MouseEvent, node: AgentFlowCustomNode) => {
        // stop propagation
        _event.stopPropagation();
        _event.preventDefault();

        setSelectedNodeId(node.id);
        setSpanForSelectedNode?.(node, nodes);

        onSelectResource?.(node.id);
      },
      [onSelectResource, setSelectedNodeId, setSpanForSelectedNode, nodes]
    );

    const handleNodeDragStart = useCallback(
      (_event: React.MouseEvent, node: AgentFlowCustomNode) => {
        setSelectedNodeId(node.id);
        onSelectResource?.(node.id);

        if (!isAgentFlowResourceNode(node)) return;
        setDragging(true, node.id);
      },
      [setSelectedNodeId, onSelectResource, setDragging]
    );

    const handleNodeDrag = useCallback(
      (_event: React.MouseEvent, node: AgentFlowCustomNode, _nodes: AgentFlowCustomNode[]) => {
        if (!isAgentFlowResourceNode(node)) return;

        const sameTypeNodes = nodes.filter(
          (n): n is AgentFlowResourceNode => n.type === "resource" && n.data.type === node.data.type && n.id !== node.id
        );
        if (sameTypeNodes.length === 0) return;

        // find out where to insert
        const orderedNodes = [...sameTypeNodes].sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
        const isVertical = node.data.type === "tool";
        const draggedPos = isVertical ? node.position.y : node.position.x;

        let insertAfterNode: AgentFlowCustomNode | null = null;

        for (let i = 0; i < orderedNodes.length; i++) {
          const targetNode = orderedNodes[i] as AgentFlowResourceNode;
          const targetPos = isVertical
            ? targetNode.data?.originalPosition?.y || targetNode.position.y
            : targetNode.data?.originalPosition?.x || targetNode.position.x;

          if (draggedPos < targetPos) {
            insertAfterNode = i > 0 ? (orderedNodes[i - 1] as AgentFlowResourceNode) : null;
            break;
          }
          if (i === orderedNodes.length - 1) {
            insertAfterNode = targetNode;
          }
        }

        setDragPreview(node.id, insertAfterNode?.id || null);
      },
      [nodes, setDragPreview]
    );

    const handleNodeDragStop = useCallback(
      (_event: React.MouseEvent, node: AgentFlowCustomNode) => {
        setDragPreview(null, null);
        if (!isAgentFlowResourceNode(node)) return;

        const sameTypeNodes = nodes.filter(
          (n): n is AgentFlowResourceNode => n.type === "resource" && n.data.type === node.data.type && n.id !== node.id
        );

        // just auto-arrange if there are no siblings
        if (sameTypeNodes.length === 0) {
          clearDragAndAutoArrange();
          return;
        }

        // find out where to insert
        const orderedNodes = [...sameTypeNodes].sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
        const isVertical = node.data.type === "tool";
        const draggedPos = isVertical ? node.position.y : node.position.x;

        let insertAfterNode: AgentFlowCustomNode | null = null;

        for (let i = 0; i < orderedNodes.length; i++) {
          const targetNode = orderedNodes[i] as AgentFlowResourceNode;
          const targetPos = isVertical
            ? targetNode.data?.originalPosition?.y || targetNode.position.y
            : targetNode.data?.originalPosition?.x || targetNode.position.x;
          if (draggedPos < targetPos) {
            insertAfterNode = i > 0 ? (orderedNodes[i - 1] as AgentFlowResourceNode) : null;
            break;
          }
          if (i === orderedNodes.length - 1) {
            insertAfterNode = orderedNodes[i] as AgentFlowResourceNode;
          }
        }

        // reorder if needed
        const currentOrder = node.data.order || 0;
        if (insertAfterNode) {
          insertNodeAfter(node.id, insertAfterNode.id);
        } else if (currentOrder !== 0) {
          // move to the beginning
          const firstNode = orderedNodes[0];
          if (firstNode) {
            reorderNodes(node.id, firstNode.id);
          }
        }

        // clear drag state and auto-arrange
        clearDragAndAutoArrange();
      },
      [setDragPreview, nodes, clearDragAndAutoArrange, insertNodeAfter, reorderNodes]
    );

    // Listen for expand agent events from CanvasPanel
    useEffect(() => {
      const handleExpandAgent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { resourceId, agentDetails } = customEvent.detail;
        expandAgent(resourceId, agentDetails);
      };

      window.addEventListener("expandAgent", handleExpandAgent);
      return () => {
        window.removeEventListener("expandAgent", handleExpandAgent);
      };
    }, [expandAgent]);

    // Listen for collapse agent events from CanvasPanel
    useEffect(() => {
      const handleCollapseAgent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { resourceId } = customEvent.detail;
        collapseAgent(resourceId);
      };

      window.addEventListener("collapseAgent", handleCollapseAgent);
      return () => {
        window.removeEventListener("collapseAgent", handleCollapseAgent);
      };
    }, [collapseAgent]);

    // Add window event to manually reset selected node
    useEffect(() => {
      const handleResetSelectedNode = () => {
        setSelectedNodeId(null);
        onSelectResource?.(null);
        fitView(AGENT_FLOW_FIT_VIEW_OPTIONS);
      };

      window.addEventListener("resetSelectedNode", handleResetSelectedNode);
      return () => {
        window.removeEventListener("resetSelectedNode", handleResetSelectedNode);
      };
    }, [setSelectedNodeId, onSelectResource, fitView]);

    // Checks if there is a selected span to set a node as selected
    useEffect(() => {
      if (nodes.length === 0 || spans.length === 0) return;

      const targetNode = getNodeFromSelectedSpan?.(nodes);

      if (targetNode && targetNode?.id !== selectedNodeId) {
        setSelectedNodeId(targetNode.id);
        onSelectResource?.(targetNode.id);
      }
    }, [nodes, setSelectedNodeId, onSelectResource, getNodeFromSelectedSpan, selectedNodeId, updateNode, spans]);

    // Add virtual spacing nodes for balanced fit view (AgentFlow-specific)
    const nodesWithVirtualSpacing = useMemo(() => {
      const agentNode = nodes.find(isAgentFlowAgentNode);
      if (!agentNode) return nodes;
      return addVirtualSpacingNodes(nodes, agentNode);
    }, [nodes]);

    return (
      <Column w="100%" h="100%" style={{ touchAction: "none" }}>
        <Column flex={1} position="relative" style={{ touchAction: "none" }}>
          <BaseCanvas<AgentFlowCustomNode, AgentFlowCustomEdge>
            ref={canvasRef}
            nodes={nodesWithVirtualSpacing}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            mode={mode}
            initialAutoLayout={autoArrange}
            fitViewOptions={AGENT_FLOW_FIT_VIEW_OPTIONS}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            deleteKeyCode={mode === "design" ? ["Backspace", "Delete"] : null}
            maintainNodesInView={selectedNodeId ? ["agent", selectedNodeId] : []}
            panShortcutTeachingUIMessage={(canvasTranslations ?? DefaultCanvasTranslations).panShortcutTeaching}
          >
            <Panel position="bottom-right">
              <CanvasPositionControls />
            </Panel>
            <Panel position="bottom-center">
              <TimelinePlayer spans={spans ?? []} enableTimelinePlayer={enableTimelinePlayer ?? true} />
            </Panel>
            {children}
          </BaseCanvas>
        </Column>
      </Column>
    );
  }
);
AgentFlowInner.displayName = "AgentFlowInner";

export const AgentFlow = (props: PropsWithChildren<AgentFlowProps>) => {
  return (
    <AgentFlowProvider {...props}>
      <AgentFlowInner {...props} />
    </AgentFlowProvider>
  );
};
