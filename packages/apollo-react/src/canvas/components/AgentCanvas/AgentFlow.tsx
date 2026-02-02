import styled from '@emotion/styled';
import { Column } from '@uipath/apollo-react/canvas/layouts';
import { Panel, useReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import type { NodeProps } from '@uipath/apollo-react/canvas/xyflow/system';
import { StickyNote as StickyNoteIcon } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { BaseCanvas } from '../../components/BaseCanvas';
import {
  type AgentFlowCustomEdge,
  type AgentFlowCustomNode,
  type AgentFlowNode,
  type AgentFlowProps,
  type AgentFlowResourceNode,
  type AgentFlowResourceNodeData,
  type AgentNodeTranslations,
  DefaultAgentNodeTranslations,
  DefaultCanvasTranslations,
  DefaultResourceNodeTranslations,
  DefaultStickyNoteNodeTranslations,
  DefaultSuggestionTranslations,
  isAgentFlowAgentNode,
  isAgentFlowResourceNode,
  isStickyNoteNode,
  type ResourceNodeTranslations,
  type SuggestionTranslations,
} from '../../types';
import { hasAgentRunning } from '../../utils/props-helpers';
import { CanvasPositionControls } from '../CanvasPositionControls';
import { StickyNoteNode, type StickyNoteNodeProps } from '../StickyNoteNode';
import { PaneContextMenu } from './components/PaneContextMenu';
import { SuggestionGroupPanel } from './components/SuggestionGroupPanel';
import { TimelinePlayer } from './components/TimelinePlayer';
import { calculateTimelineHeight } from './components/TimelinePlayer.utils';
import { Edge } from './edges/Edge';
import { AgentNodeElement } from './nodes/AgentNode';
import { ResourceNode } from './nodes/ResourceNode';
import { AgentFlowProvider, useAgentFlowStore } from './store/agent-flow-store';
import { NodeRegistryProvider } from '../../core/NodeRegistryProvider';
import { agentFlowManifest } from './agent-flow.manifest';

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  background: var(--uix-canvas-background);
  border: 1px solid var(--uix-canvas-border-de-emp);
  border-radius: 16px;
  padding: 4px;
  gap: 4px;
  height: 50px;
`;

const ToolbarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 16px;
  transition: background-color 0.15s ease;
  color: var(--uix-canvas-foreground);

  &:hover {
    background: var(--uix-canvas-background-hover);
  }
`;

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
  enableInstructions?: boolean;
  healthScore?: number;
  onHealthScoreClick?: () => void;
  suggestionGroupVersion?: string;
}) => {
  return (props: NodeProps<AgentFlowNode>) => {
    const { props: storeProps, nodes, setSelectedNodeId } = useAgentFlowStore();

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

    const handleAddInstructions = useCallback(() => {
      setSelectedNodeId(props.id);
      storeProps.onSelectResource?.(props.id);
    }, [setSelectedNodeId, storeProps.onSelectResource, props.id]);

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
        onAddInstructions={handleAddInstructions}
        translations={handlers.translations ?? DefaultAgentNodeTranslations}
        suggestionTranslations={handlers.suggestionTranslations ?? DefaultSuggestionTranslations}
        enableMemory={handlers.enableMemory === true}
        enableInstructions={handlers.enableInstructions === true}
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
    stickyNoteNodeTranslations,
    canvasTranslations,
    enableTimelinePlayer,
    canvasRef,
    enableMcpTools,
    enableMemory,
    enableStickyNotes,
    enableInstructions,
    healthScore,
    onHealthScoreClick,
    suggestionTranslations,
    suggestionGroup,
    onAgentNodePositionChange,
    onResourceNodePositionChange,
    onOrganize,
    onUpdateStickyNote,
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
      addStickyNote,
      paneContextMenu,
      openPaneContextMenu,
      closePaneContextMenu,
    } = useAgentFlowStore();

    const nodeTypesBase = useMemo(
      () => ({
        stickyNote: (props: StickyNoteNodeProps) => (
          <StickyNoteNode
            {...props}
            placeholder={
              (stickyNoteNodeTranslations ?? DefaultStickyNoteNodeTranslations).placeholder
            }
            renderPlaceholderOnSelect={true}
          />
        ),
      }),
      [stickyNoteNodeTranslations]
    );

    const { fitView: reactFlowFitView, screenToFlowPosition: reactFlowScreenToFlowPosition } =
      useReactFlow();
    const timelinePlayerRef = useRef<HTMLDivElement>(null);
    const suggestionGroupPanelRef = useRef<HTMLDivElement>(null);
    const toolbarContainerRef = useRef<HTMLDivElement>(null);

    // Calculate if timeline will be visible
    const timelineHeight = useMemo(
      () => calculateTimelineHeight(enableTimelinePlayer, spans),
      [enableTimelinePlayer, spans]
    );
    // Calculate suggestion group panel height
    const suggestionGroupPanelHeight = suggestionGroupPanelRef.current?.offsetHeight || 0;
    // Calculate toolbar container height
    const toolbarContainerHeight = toolbarContainerRef.current?.offsetHeight || 0;

    // Calculate adjusted fitView options that account for timeline player height and suggestion group panel height
    const adjustedFitViewOptions = useMemo(() => {
      if (
        [timelineHeight, suggestionGroupPanelHeight, toolbarContainerHeight].some(
          (height) => height > 0
        )
      ) {
        const viewportHeight = window.innerHeight;
        const timelineRatio = timelineHeight / viewportHeight;
        const suggestionGroupPanelRatio = suggestionGroupPanelHeight / viewportHeight;
        const toolbarContainerRatio = toolbarContainerHeight / viewportHeight;
        const bottomPadding =
          AGENT_FLOW_FIT_VIEW_OPTIONS.padding.bottom +
          3 * (timelineRatio + suggestionGroupPanelRatio + toolbarContainerRatio);

        return {
          ...AGENT_FLOW_FIT_VIEW_OPTIONS,
          padding: {
            ...AGENT_FLOW_FIT_VIEW_OPTIONS.padding,
            bottom: bottomPadding,
          },
        };
      }

      return AGENT_FLOW_FIT_VIEW_OPTIONS;
    }, [timelineHeight, suggestionGroupPanelHeight, toolbarContainerHeight]);

    const nodeTypes = useMemo(() => {
      const handleAddResource = (
        type: 'context' | 'escalation' | 'mcp' | 'tool' | 'memorySpace'
      ) => {
        // Use createResourcePlaceholder which will either create a placeholder or call onAddResource
        createResourcePlaceholder(type);
      };

      const suggestionGroupVersion = suggestionGroup?.metadata?.version;

      return {
        ...nodeTypesBase,
        agent: createAgentNodeWrapper({
          onAddResource: handleAddResource,
          translations: agentNodeTranslations,
          suggestionTranslations,
          enableMcpTools,
          enableMemory,
          enableInstructions,
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
      closePaneContextMenu();

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
    }, [onSelectResource, setSelectedNodeId, closePaneContextMenu]);

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

    const handlePaneContextMenu = useCallback(
      (event: React.MouseEvent | MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();

        // Get screen position for the menu
        const screenPosition = { x: event.clientX, y: event.clientY };

        // Convert screen position to flow position for placing sticky notes
        const flowPosition = reactFlowScreenToFlowPosition(screenPosition);

        openPaneContextMenu(screenPosition, flowPosition);
      },
      [openPaneContextMenu, reactFlowScreenToFlowPosition]
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
        // Handle sticky note drag
        if (isStickyNoteNode(node)) {
          onUpdateStickyNote?.(node.id, {
            position: { x: node.position.x, y: node.position.y },
          });
          return;
        }

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
      [onAgentNodePositionChange, onResourceNodePositionChange, onUpdateStickyNote, nodes]
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
            onPaneContextMenu={handlePaneContextMenu}
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
                onOrganize={mode === 'design' ? onOrganize : undefined}
              />
            </Panel>
            <Panel position="bottom-center">
              <div ref={timelinePlayerRef}>
                <TimelinePlayer
                  spans={spans ?? []}
                  enableTimelinePlayer={enableTimelinePlayer ?? true}
                />
              </div>
              <div ref={toolbarContainerRef}>
                {enableStickyNotes && mode === 'design' && !suggestionGroup?.suggestions.length && (
                  <ToolbarContainer className="nodrag nopan nowheel">
                    <ToolbarButton
                      type="button"
                      onClick={() => addStickyNote()}
                      title={(canvasTranslations ?? DefaultCanvasTranslations).addNote}
                    >
                      <StickyNoteIcon size={16} />
                    </ToolbarButton>
                  </ToolbarContainer>
                )}
              </div>
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
          {mode === 'design' && (
            <PaneContextMenu
              isOpen={paneContextMenu !== null}
              position={paneContextMenu?.position ?? { x: 0, y: 0 }}
              items={[
                ...(enableStickyNotes
                  ? [
                      {
                        label: (canvasTranslations ?? DefaultCanvasTranslations).addNote,
                        onClick: () =>
                          addStickyNote({
                            position: paneContextMenu?.flowPosition ?? { x: 0, y: 0 },
                          }),
                      },
                    ]
                  : []),
                ...(onOrganize
                  ? [
                      {
                        label: (canvasTranslations ?? DefaultCanvasTranslations).organize,
                        onClick: onOrganize,
                      },
                    ]
                  : []),
              ]}
              onClose={closePaneContextMenu}
            />
          )}
        </Column>
      </Column>
    );
  }
);
AgentFlowInner.displayName = 'AgentFlowInner';

export const AgentFlow = (props: PropsWithChildren<AgentFlowProps>) => {
  return (
    <NodeRegistryProvider manifest={agentFlowManifest}>
      <AgentFlowProvider {...props}>
        <AgentFlowInner {...props} />
      </AgentFlowProvider>
    </NodeRegistryProvider>
  );
};
