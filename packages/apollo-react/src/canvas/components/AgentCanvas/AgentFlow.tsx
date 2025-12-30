import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import type { PropsWithChildren } from 'react';
import { Panel, useReactFlow } from '@uipath/uix/xyflow/react';
import type { NodeProps } from '@uipath/uix/xyflow/system';
import { BaseCanvas } from '../../components/BaseCanvas';
import { TimelinePlayer } from './components/TimelinePlayer';
import { Edge } from './edges/Edge';
import { Column } from '@uipath/uix/core';
import { AgentNodeElement } from './nodes/AgentNode';
import { ResourceNode } from './nodes/ResourceNode';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { AgentFlowProvider, useAgentFlowStore } from './store/agent-flow-store';
import {
  type AgentFlowCustomEdge,
  type AgentFlowCustomNode,
  type AgentFlowNode,
  type AgentFlowProps,
  type AgentFlowResourceNode,
  type AgentNodeTranslations,
  DefaultAgentNodeTranslations,
  DefaultCanvasTranslations,
  isAgentFlowAgentNode,
  isAgentFlowResourceNode,
  type AgentFlowResourceNodeData,
  DefaultResourceNodeTranslations,
  type ResourceNodeTranslations,
  type SuggestionTranslations,
  DefaultSuggestionTranslations,
} from '../../types';
import { hasAgentRunning } from '../../utils/props-helpers';
import { SuggestionGroupPanel } from './components/SuggestionGroupPanel';
import { calculateTimelineHeight } from './components/TimelinePlayer.utils';

const edgeTypes = {
  default: Edge,
};

// AgentFlow-specific fit view options with reduced padding
const AGENT_FLOW_FIT_VIEW_OPTIONS = {
  padding: {
    top: 0.3,
    right: 0.3,
    bottom: 0.3,
    left: 0.3,
  },
  duration: 300,
};

// agent node wrapper
const createAgentNodeWrapper = (handlers: {
  onAddResource?: (type: 'context' | 'escalation' | 'mcp' | 'tool' | 'memorySpace') => void;
  translations?: AgentNodeTranslations;
  suggestionTranslations?: SuggestionTranslations;
  enableMcpTools?: boolean;
  enableMemory?: boolean;
  healthScore?: number;
  onHealthScoreClick?: () => void;
  suggestionGroupVersion?: string;
}) => {
  return (props: NodeProps<AgentFlowNode>) => {
    const { props: storeProps, nodes } = useAgentFlowStore();

    const hasContext = nodes.some(
      (node) =>
        isAgentFlowResourceNode(node) &&
        node.data.type === 'context' &&
        node.data.parentNodeId === props.id
    );

    const hasEscalation = nodes.some(
      (node) =>
        isAgentFlowResourceNode(node) &&
        node.data.type === 'escalation' &&
        node.data.parentNodeId === props.id
    );

    const hasTool = nodes.some(
      (node) =>
        isAgentFlowResourceNode(node) &&
        node.data.type === 'tool' &&
        node.data.parentNodeId === props.id
    );

    const hasMcp =
      handlers.enableMcpTools !== false &&
      nodes.some(
        (node) =>
          isAgentFlowResourceNode(node) &&
          node.data.type === 'mcp' &&
          node.data.parentNodeId === props.id
      );

    const hasMemory = nodes.some(
      (node) =>
        isAgentFlowResourceNode(node) &&
        node.data.type === 'memorySpace' &&
        node.data.parentNodeId === props.id
    );

    // Check if agent itself is running OR if any of its resources are running on view mode OR if it's processing a suggestion
    const agentRunning = hasAgentRunning(storeProps.spans);
    const resourceRunning = nodes.some(
      (node) =>
        isAgentFlowResourceNode(node) &&
        storeProps.mode === 'view' &&
        node.data.parentNodeId === props.id &&
        node.data.hasRunning
    );
    const agentProcessing = props.data.isProcessing;
    const hasRunning = agentRunning || resourceRunning || agentProcessing;

    const hasError =
      !hasRunning &&
      nodes.some(
        (node) =>
          isAgentFlowResourceNode(node) && node.data.parentNodeId === props.id && node.data.hasError
      );
    const hasSuccess =
      !hasRunning &&
      nodes.some(
        (node) =>
          isAgentFlowResourceNode(node) &&
          node.data.parentNodeId === props.id &&
          node.data.hasSuccess
      );

    return (
      <AgentNodeElement
        {...props}
        hasContext={hasContext}
        hasEscalation={hasEscalation}
        hasTool={hasTool}
        hasMcp={hasMcp}
        hasMemory={hasMemory}
        mcpEnabled={handlers.enableMcpTools !== false}
        mode={storeProps.mode}
        hasError={hasError}
        hasSuccess={hasSuccess}
        hasRunning={hasRunning}
        onAddResource={handlers.onAddResource}
        translations={handlers.translations ?? DefaultAgentNodeTranslations}
        suggestionTranslations={handlers.suggestionTranslations ?? DefaultSuggestionTranslations}
        enableMemory={handlers.enableMemory === true}
        healthScore={handlers.healthScore}
        onHealthScoreClick={handlers.onHealthScoreClick}
        suggestionGroupVersion={handlers.suggestionGroupVersion}
      />
    );
  };
};

// resource node wrapper
const createResourceNodeWrapper = (opts: {
  onEnable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onDisable?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onRemoveBreakpoint?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onAddGuardrail?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onGoToSource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onExpandResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  onCollapseResource?: (resourceId: string, resource: AgentFlowResourceNodeData) => void;
  translations?: ResourceNodeTranslations;
  suggestionTranslations?: SuggestionTranslations;
  suggestionGroupVersion?: string;
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
        onEnable={opts.onEnable}
        onDisable={opts.onDisable}
        onAddBreakpoint={opts.onAddBreakpoint}
        onRemoveBreakpoint={opts.onRemoveBreakpoint}
        onAddGuardrail={opts.onAddGuardrail}
        onGoToSource={opts.onGoToSource}
        onRemoveResource={deleteNode}
        onExpandResource={opts.onExpandResource}
        onCollapseResource={opts.onCollapseResource}
        translations={opts.translations ?? DefaultResourceNodeTranslations}
        suggestionTranslations={opts.suggestionTranslations ?? DefaultSuggestionTranslations}
        suggestionGroupVersion={opts.suggestionGroupVersion}
      />
    );
  };
};

const AgentFlowInner = memo(
  ({
    children,
    mode,
    spans,
    onEnable,
    onDisable,
    onAddBreakpoint,
    onRemoveBreakpoint,
    onAddGuardrail,
    onGoToSource,
    onAddResource: _onAddResource, // Handled by createResourcePlaceholder in store
    onSelectResource,
    setSpanForSelectedNode,
    getNodeFromSelectedSpan,
    onExpandResource,
    onCollapseResource,
    agentNodeTranslations,
    resourceNodeTranslations,
    canvasTranslations,
    enableTimelinePlayer,
    canvasRef,
    enableMcpTools,
    enableMemory,
    healthScore,
    onHealthScoreClick,
    suggestionTranslations,
    suggestionGroup,
    onAgentNodePositionChange,
    onResourceNodePositionChange,
    zoomLevel,
    onZoomLevelChange,
  }: PropsWithChildren<AgentFlowProps>) => {
    const {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      onConnect,
      autoArrange,
      updateNode,
      setSelectedNodeId,
      selectedNodeId,
      setDragging,
      expandAgent,
      collapseAgent,
      createResourcePlaceholder,
      actOnSuggestionGroup,
      currentSuggestionIndex,
      navigateToNextSuggestion,
      navigateToPreviousSuggestion,
    } = useAgentFlowStore();

    const { fitView: reactFlowFitView } = useReactFlow();
    const timelinePlayerRef = useRef<HTMLDivElement>(null);
    const suggestionGroupPanelRef = useRef<HTMLDivElement>(null);

    // Calculate if timeline will be visible
    const timelineHeight = useMemo(
      () => calculateTimelineHeight(enableTimelinePlayer, spans),
      [enableTimelinePlayer, spans]
    );
    // Calculate suggestion group panel height
    const suggestionGroupPanelHeight = suggestionGroupPanelRef.current?.offsetHeight || 0;

    // Calculate adjusted fitView options that account for timeline player height and suggestion group panel height
    const adjustedFitViewOptions = useMemo(() => {
      if (timelineHeight > 0 || suggestionGroupPanelHeight > 0) {
        const viewportHeight = window.innerHeight;
        const timelineRatio = timelineHeight / viewportHeight;
        const suggestionGroupPanelRatio = suggestionGroupPanelHeight / viewportHeight;
        const bottomPadding =
          AGENT_FLOW_FIT_VIEW_OPTIONS.padding.bottom +
          3 * (timelineRatio + suggestionGroupPanelRatio);

        return {
          ...AGENT_FLOW_FIT_VIEW_OPTIONS,
          padding: {
            ...AGENT_FLOW_FIT_VIEW_OPTIONS.padding,
            bottom: bottomPadding,
          },
        };
      }

      return AGENT_FLOW_FIT_VIEW_OPTIONS;
    }, [timelineHeight, suggestionGroupPanelHeight]);

    const nodeTypes = useMemo(() => {
      const handleAddResource = (
        type: 'context' | 'escalation' | 'mcp' | 'tool' | 'memorySpace'
      ) => {
        // Use createResourcePlaceholder which will either create a placeholder or call onAddResource
        createResourcePlaceholder(type);
      };

      const suggestionGroupVersion = suggestionGroup?.metadata?.version;

      return {
        agent: createAgentNodeWrapper({
          onAddResource: handleAddResource,
          translations: agentNodeTranslations,
          suggestionTranslations,
          enableMcpTools,
          enableMemory,
          healthScore,
          onHealthScoreClick,
          suggestionGroupVersion,
        }),
        resource: createResourceNodeWrapper({
          onEnable,
          onDisable,
          onAddBreakpoint,
          onRemoveBreakpoint,
          onAddGuardrail,
          onGoToSource,
          onExpandResource,
          onCollapseResource,
          translations: resourceNodeTranslations,
          suggestionTranslations,
          suggestionGroupVersion,
        }),
      };
    }, [
      onEnable,
      onDisable,
      onAddBreakpoint,
      onRemoveBreakpoint,
      onAddGuardrail,
      onGoToSource,
      healthScore,
      onHealthScoreClick,
      createResourcePlaceholder,
      agentNodeTranslations,
      resourceNodeTranslations,
      suggestionTranslations,
      onExpandResource,
      onCollapseResource,
      enableMcpTools,
      enableMemory,
      suggestionGroup?.metadata?.version,
    ]);

    const handlePaneClick = useCallback(() => {
      setSelectedNodeId(null);
      onSelectResource?.('pane');

      // If there are placeholder suggestions, reject them when clicking outside
      // if (storeProps.suggestionGroup?.suggestions) {
      //   const placeholderSuggestions = storeProps.suggestionGroup.suggestions.filter(
      //     (suggestion) => suggestion.type === "add" && suggestion.resource
      //   );

      //   // Reject all placeholder suggestions
      //   placeholderSuggestions.forEach((suggestion) => {
      //     rejectSuggestion(suggestion.id);
      //   });
      // }
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

    const handleNodeContextMenu = useCallback(
      (event: React.MouseEvent, node: AgentFlowCustomNode) => {
        event.stopPropagation();
        event.preventDefault();

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

    const handleNodeDragStop = useCallback(
      (_event: React.MouseEvent, node: AgentFlowCustomNode) => {
        if (!isAgentFlowResourceNode(node)) {
          onAgentNodePositionChange?.({ x: node.position.x, y: node.position.y });
          return;
        }

        // When resource is dragged, also capture current agent position
        const agentNode = nodes.find(isAgentFlowAgentNode);
        if (agentNode) {
          onAgentNodePositionChange?.({ x: agentNode.position.x, y: agentNode.position.y });
        }

        onResourceNodePositionChange?.(node.id, { x: node.position.x, y: node.position.y });
      },
      [onAgentNodePositionChange, onResourceNodePositionChange, nodes]
    );

    // Listen for expand agent events from CanvasPanel
    useEffect(() => {
      const handleExpandAgent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { resourceId, agentDetails } = customEvent.detail;
        expandAgent(resourceId, agentDetails);
      };

      window.addEventListener('expandAgent', handleExpandAgent);
      return () => {
        window.removeEventListener('expandAgent', handleExpandAgent);
      };
    }, [expandAgent]);

    // Listen for collapse agent events from CanvasPanel
    useEffect(() => {
      const handleCollapseAgent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { resourceId } = customEvent.detail;
        collapseAgent(resourceId);
      };

      window.addEventListener('collapseAgent', handleCollapseAgent);
      return () => {
        window.removeEventListener('collapseAgent', handleCollapseAgent);
      };
    }, [collapseAgent]);

    // Add window event to manually reset selected node
    useEffect(() => {
      const handleResetSelectedNode = () => {
        setSelectedNodeId(null);
        onSelectResource?.(null);
        reactFlowFitView(adjustedFitViewOptions);
      };

      window.addEventListener('resetSelectedNode', handleResetSelectedNode);
      return () => {
        window.removeEventListener('resetSelectedNode', handleResetSelectedNode);
      };
    }, [setSelectedNodeId, onSelectResource, reactFlowFitView, adjustedFitViewOptions]);

    // Checks if there is a selected span to set a node as selected
    useEffect(() => {
      if (nodes.length === 0 || spans.length === 0) return;

      const targetNode = getNodeFromSelectedSpan?.(nodes);

      if (targetNode && targetNode?.id !== selectedNodeId) {
        setSelectedNodeId(targetNode.id);
        onSelectResource?.(targetNode.id);
      }
    }, [
      nodes,
      setSelectedNodeId,
      onSelectResource,
      getNodeFromSelectedSpan,
      selectedNodeId,
      updateNode,
      spans,
    ]);

    // Filter nodes based on feature flags
    const filteredNodes = nodes.filter((node) => {
      if (!isAgentFlowResourceNode(node)) return true;
      if (node.data.isVirtual) return true; // Always keep virtual nodes
      if (node.data.type === 'memorySpace') return !!enableMemory;
      return true;
    });

    // Create custom defaultViewport if zoomLevel is provided
    const defaultViewport = useMemo(() => {
      if (zoomLevel !== undefined) {
        return {
          x: 0,
          y: 0,
          zoom: zoomLevel,
        };
      }
      return undefined; // Let BaseCanvas use its default
    }, [zoomLevel]);

    // Handle viewport changes to capture zoom level changes
    const handleViewportChange = useCallback(
      (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
        // Round to 2 decimal places to avoid floating-point precision issues during pan
        const newZoomLevel = Math.round(viewport.zoom * 100) / 100;
        const currentZoomLevel = zoomLevel ? Math.round(zoomLevel * 100) / 100 : undefined;

        // Only call onSetZoom when zoom actually changes
        if (onZoomLevelChange && newZoomLevel !== currentZoomLevel) {
          onZoomLevelChange(newZoomLevel);
        }
      },
      [onZoomLevelChange, zoomLevel]
    );

    return (
      <Column w="100%" h="100%" style={{ touchAction: 'none' }}>
        <Column flex={1} position="relative" style={{ touchAction: 'none' }}>
          <BaseCanvas<AgentFlowCustomNode, AgentFlowCustomEdge>
            ref={canvasRef}
            nodes={filteredNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            mode={mode}
            initialAutoLayout={autoArrange}
            fitViewOptions={adjustedFitViewOptions}
            defaultViewport={defaultViewport}
            onMove={handleViewportChange}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
            onPaneClick={handlePaneClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDragStop={handleNodeDragStop}
            deleteKeyCode={mode === 'design' ? ['Backspace', 'Delete'] : null}
            maintainNodesInView={[]}
            panShortcutTeachingUIMessage={
              (canvasTranslations ?? DefaultCanvasTranslations).panShortcutTeaching
            }
          >
            <Panel position="bottom-right">
              <CanvasPositionControls
                fitViewOptions={adjustedFitViewOptions}
                translations={canvasTranslations ?? DefaultCanvasTranslations}
                showOrganize={false} // TODO: Change to `mode === "design"` once tidy-up function is implemented
              />
            </Panel>
            <Panel position="bottom-center">
              <div ref={timelinePlayerRef}>
                <TimelinePlayer
                  spans={spans ?? []}
                  enableTimelinePlayer={enableTimelinePlayer ?? true}
                />
              </div>
            </Panel>
            <Panel position="bottom-center">
              <div ref={suggestionGroupPanelRef}>
                <SuggestionGroupPanel
                  suggestionGroup={suggestionGroup}
                  onRejectAll={(suggestionGroupId: string) =>
                    actOnSuggestionGroup?.(suggestionGroupId, 'reject')
                  }
                  onAcceptAll={(suggestionGroupId: string) =>
                    actOnSuggestionGroup?.(suggestionGroupId, 'accept')
                  }
                  currentIndex={currentSuggestionIndex}
                  onNavigateNext={navigateToNextSuggestion}
                  onNavigatePrevious={navigateToPreviousSuggestion}
                />
              </div>
            </Panel>
            {children}
          </BaseCanvas>
        </Column>
      </Column>
    );
  }
);
AgentFlowInner.displayName = 'AgentFlowInner';

export const AgentFlow = (props: PropsWithChildren<AgentFlowProps>) => {
  return (
    <AgentFlowProvider {...props}>
      <AgentFlowInner {...props} />
    </AgentFlowProvider>
  );
};
