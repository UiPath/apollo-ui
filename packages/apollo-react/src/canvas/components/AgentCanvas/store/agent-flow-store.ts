import React, { createContext, useContext, useEffect, useState } from "react";
import { addEdge, applyEdgeChanges, applyNodeChanges, type Connection, type EdgeChange, type NodeChange } from "@uipath/uix/xyflow/react";
import { createStore, useStore } from "zustand";
import { BASE_CANVAS_DEFAULTS, FLOW_LAYOUT } from "../../BaseCanvas/BaseCanvas.constants";
import {
  type AgentFlowCustomEdge,
  type AgentFlowCustomNode,
  type AgentFlowModel,
  type AgentFlowNodeDataUpdate,
  type AgentFlowProps,
  type AgentFlowResource,
  type AgentFlowResourceNode,
  type AgentFlowResourceNodeData,
  isAgentFlowAgentNode,
  isAgentFlowResourceNode,
} from "../../../types";
import { autoArrangeNodes } from "../../../utils/auto-layout";
import {
  computeNodesAndEdges,
  hasModelError,
  hasModelRunning,
  hasModelSuccess,
  hasResourceError,
  hasResourceRunning,
  hasResourceSuccess,
  NODE_ID_DELIMITER,
} from "../../../utils/props-helpers";
import { addAnimationClasses, removeAnimationClasses } from "../../../utils/resource-operations";

const getSelectedNodeId = (props: AgentFlowProps, state: AgentFlowStore): string | null => {
  const { initialSelectedResource, onSelectResource, setSpanForSelectedNode } = props;
  const { nodes } = state;

  // If no initial selected resource, auto-select the agent node
  if (!initialSelectedResource) {
    onSelectResource?.("agent");
    return "agent";
  }

  const node = nodes.find(
    ({ id, data }) =>
      (data as AgentFlowResourceNodeData)?.type === initialSelectedResource.type &&
      id.startsWith(`agent${NODE_ID_DELIMITER}${initialSelectedResource.name}:`)
  );
  if (!node) return null;

  // Select the node and set the span for the selected node
  setSpanForSelectedNode?.(node, nodes);
  onSelectResource?.(node.id);
  return node.id;
};

const clearNodeAnimations = (node: AgentFlowCustomNode): AgentFlowCustomNode => {
  if (!node.style?.transition) return node;
  const { transition: _, ...cleanStyle } = node.style;
  return { ...node, style: cleanStyle };
};

const shouldCreateSpacing = (insertIndex: number, siblingCount: number, originalIndex?: number): boolean => {
  const isInsertingBetween = insertIndex > 0 && insertIndex < siblingCount;
  const isMovingToEdge =
    originalIndex !== undefined && (insertIndex === 0 || insertIndex === siblingCount) && originalIndex !== insertIndex;
  return isInsertingBetween || isMovingToEdge;
};

const hasExistingSpacing = (
  nodes: AgentFlowCustomNode[],
  draggedNodeType: AgentFlowResourceNodeData["type"],
  draggedNodeId: string
): boolean => {
  return nodes.some(
    (node) => isAgentFlowResourceNode(node) && node.data.type === draggedNodeType && node.id !== draggedNodeId && node.data.originalPosition
  );
};

const applyTransitionToNode = (node: AgentFlowCustomNode, draggedNodeId: string): AgentFlowCustomNode => {
  if (node.style?.transition || node.id === draggedNodeId) return node;
  return {
    ...node,
    style: { ...node.style, transition: BASE_CANVAS_DEFAULTS.transitions.default.cssValue },
  } satisfies AgentFlowCustomNode;
};

const calculateSpacingPositions = (
  siblingNodes: AgentFlowResourceNode[],
  insertIndex: number,
  draggedNode: AgentFlowResourceNode,
  agentNode: AgentFlowCustomNode
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  const isVertical = false;
  const isEdgeInsertion = insertIndex === 0 || insertIndex === siblingNodes.length;

  // edge insertions
  if (isEdgeInsertion) {
    const agentWidth = agentNode.measured?.width ?? agentNode.width ?? 0;
    const agentHeight = agentNode.measured?.height ?? agentNode.height ?? 0;
    const agentCenterX = agentNode.position.x + agentWidth / 2;
    const agentCenterY = agentNode.position.y + agentHeight / 2;

    // push all nodes to make room at start/end
    for (const [index, node] of siblingNodes.entries()) {
      const nodeWidth = node.measured?.width ?? node.width ?? 0;
      const nodeHeight = node.measured?.height ?? node.height ?? 0;

      if (isVertical) {
        const baseY =
          agentCenterY - nodeHeight / 2 + (index + (insertIndex === 0 ? 1 : 0) - siblingNodes.length / 2) * FLOW_LAYOUT.groupSpacing;

        if (draggedNode.data.type === "tool") {
          positions[node.id] = {
            x: agentNode.position.x + agentWidth + FLOW_LAYOUT.groupDistanceHorizontal,
            y: baseY,
          };
        } else {
          positions[node.id] = {
            x: agentNode.position.x - nodeWidth - FLOW_LAYOUT.groupDistanceHorizontal,
            y: baseY,
          };
        }
      } else {
        const baseX =
          agentCenterX - nodeWidth / 2 + (index + (insertIndex === 0 ? 1 : 0) - siblingNodes.length / 2) * FLOW_LAYOUT.groupSpacing;

        // escalation
        if (draggedNode.data.type === "escalation") {
          positions[node.id] = {
            x: baseX,
            y: agentNode.position.y - nodeHeight - FLOW_LAYOUT.groupDistanceVertical,
          };
        } else {
          // model, context, tool
          positions[node.id] = {
            x: baseX,
            y: agentNode.position.y + agentHeight + FLOW_LAYOUT.groupDistanceVertical,
          };
        }
      }
    }

    return positions;
  }

  // middle insertion with a placeholder gap
  const previewOrder = [
    ...siblingNodes.slice(0, insertIndex),
    null, // the placeholder
    ...siblingNodes.slice(insertIndex),
  ];

  const agentWidth = agentNode.measured?.width ?? agentNode.width ?? 0;
  const agentHeight = agentNode.measured?.height ?? agentNode.height ?? 0;
  const agentCenterX = agentNode.position.x + agentWidth / 2;
  const agentCenterY = agentNode.position.y + agentHeight / 2;

  for (const [index, node] of previewOrder.entries()) {
    if (!node) continue; // skip placeholder

    const nodeWidth = node.measured?.width ?? node.width ?? 0;
    const nodeHeight = node.measured?.height ?? node.height ?? 0;

    if (isVertical) {
      const baseY = agentCenterY - nodeHeight / 2 + (index - (previewOrder.length - 1) / 2) * FLOW_LAYOUT.groupSpacing;

      // tool
      if (draggedNode.data.type === "tool") {
        positions[node.id] = {
          x: agentNode.position.x + agentWidth + FLOW_LAYOUT.groupDistanceHorizontal,
          y: baseY,
        };
      } else {
        // model
        positions[node.id] = {
          x: agentNode.position.x - nodeWidth - FLOW_LAYOUT.groupDistanceHorizontal,
          y: baseY,
        };
      }
    } else {
      const baseX = agentCenterX - nodeWidth / 2 + (index - (previewOrder.length - 1) / 2) * FLOW_LAYOUT.groupSpacing;

      // escalation
      if (draggedNode.data.type === "escalation") {
        positions[node.id] = {
          x: baseX,
          y: agentNode.position.y - nodeHeight - FLOW_LAYOUT.groupDistanceVertical,
        };
      } else {
        // context, tool
        positions[node.id] = {
          x: baseX,
          y: agentNode.position.y + agentHeight + FLOW_LAYOUT.groupDistanceVertical,
        };
      }
    }
  }

  return positions;
};

const createSpacingState = (
  nodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[],
  draggedNodeId: string,
  spacingPositions: Record<string, { x: number; y: number }>
): { nodes: AgentFlowCustomNode[]; edges: AgentFlowCustomEdge[] } => {
  const spacedNodes = nodes.map((node) => {
    if (!isAgentFlowResourceNode(node) || node.id === draggedNodeId) return node; // ignore dragged node

    const newPosition = spacingPositions[node.id];
    if (!newPosition) return node;

    const nodeWithTransition = applyTransitionToNode(node, draggedNodeId);
    return {
      ...nodeWithTransition,
      position: newPosition,
      data: {
        ...node.data,
        originalPosition: node.data.originalPosition ?? node.position,
      },
    } as AgentFlowCustomNode;
  });

  // apply edge animations
  const animatedEdges = edges.map((edge) => {
    if (edge.source === draggedNodeId || edge.target === draggedNodeId) {
      return edge;
    }
    return addAnimationClasses([edge])[0] as AgentFlowCustomEdge;
  });

  return { nodes: spacedNodes, edges: animatedEdges };
};

const createCollapseState = (
  nodes: AgentFlowCustomNode[],
  edges: AgentFlowCustomEdge[],
  draggedNodeId: string,
  draggedNodeType: AgentFlowResourceNodeData["type"]
): { nodes: AgentFlowCustomNode[]; edges: AgentFlowCustomEdge[] } => {
  const collapsedNodes = nodes.map((node) => {
    if (!isAgentFlowResourceNode(node) || node.data.type !== draggedNodeType || node.id === draggedNodeId || !node.data.originalPosition) {
      return node;
    }

    const nodeWithTransition = applyTransitionToNode(node, draggedNodeId);
    return {
      ...nodeWithTransition,
      position: node.data.originalPosition,
    };
  });

  // apply edge animations
  const animatedEdges = edges.map((edge) => {
    if (edge.source === draggedNodeId || edge.target === draggedNodeId) {
      return edge;
    }
    return addAnimationClasses([edge])[0] as AgentFlowCustomEdge;
  });

  return { nodes: collapsedNodes, edges: animatedEdges };
};

interface AgentFlowStore {
  // props state
  props: AgentFlowProps;
  handlePropsUpdate: (newProps: AgentFlowProps) => void;

  // computed state from props
  nodes: AgentFlowCustomNode[];
  edges: AgentFlowCustomEdge[];

  // selection & UI
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  openMenuNodeId: string | null;
  setOpenMenuNodeId: (nodeId: string | null) => void;

  // nodes
  updateNode: <T extends AgentFlowCustomNode>(nodeId: string, updates: AgentFlowNodeDataUpdate<T>) => void;
  deleteNode: (nodeId: string) => void;
  reorderNodes: (draggedNodeId: string, targetNodeId: string) => void;
  insertNodeAfter: (draggedNodeId: string, targetNodeId: string) => void;
  onNodesChange: (changes: NodeChange[]) => void;

  // edges
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // auto-arrange & drag
  isDragging: boolean;
  draggedNodeId: string | null;
  dragPreview: {
    draggedNodeId: string | null;
    insertAfterNodeId: string | null;
    previewPositions: Record<string, { x: number; y: number }>;
  };
  setDragging: (isDragging: boolean, draggedNodeId: string | null) => void;
  autoArrange: () => void;
  clearDragAndAutoArrange: () => void;
  setDragPreview: (draggedNodeId: string | null, insertAfterNodeId: string | null) => void;

  // canvas operations
  fitView: () => void;
  autoArrangeAndFitView: () => void;

  // hierarchical flow support
  expandAgent: (
    resourceId: string,
    agentDefinition: {
      rawAgentDefinition: Record<string, unknown> | null;
      agentName: string;
      agentDescription: string;
      agentResources: AgentFlowResource[];
      model: AgentFlowModel | null;
      error: string | null;
    }
  ) => void;
  collapseAgent: (resourceId: string) => void;
}

export const hasResourceNode = (node: AgentFlowCustomNode, resource: AgentFlowResource) => node?.id?.endsWith(`:${resource.id}`);

export const hasModelNode = (node: AgentFlowCustomNode): node is AgentFlowResourceNode =>
  node?.id?.endsWith("model") && isAgentFlowResourceNode(node) && node.data.type === "model";

export const createAgentFlowStore = (initialProps: AgentFlowProps) =>
  createStore<AgentFlowStore>()((set, get) => {
    const { nodes: initialNodes, edges: initialEdges } = computeNodesAndEdges(initialProps);

    return {
      // props state
      props: initialProps,
      handlePropsUpdate: (newProps) => {
        const state = get();

        // diff previous and new resources
        const currentResourceIds = new Set(state.props.resources.map((r) => r.id));
        const newResourceIds = new Set(newProps.resources.map((r) => r.id));
        const resourcesAddedOrRemoved =
          currentResourceIds.size !== newResourceIds.size ||
          [...currentResourceIds].some((id) => !newResourceIds.has(id)) ||
          [...newResourceIds].some((id) => !currentResourceIds.has(id));

        // check if model properties changed (but not added/removed)
        const hadModelNode = state.nodes.some(hasModelNode);
        const willHaveModelNode = Boolean(newProps.model);
        const modelChanged = hadModelNode !== willHaveModelNode;

        // resources added/removed
        if (resourcesAddedOrRemoved || modelChanged) {
          const removedIds = new Set([...currentResourceIds].filter((id) => !newResourceIds.has(id)));
          const addedIds = new Set([...newResourceIds].filter((id) => !currentResourceIds.has(id)));

          // remove deleted nodes
          const updatedNodes = state.nodes.filter((node) => {
            if (hasModelNode(node)) return willHaveModelNode;
            if (isAgentFlowResourceNode(node)) {
              // check if this node corresponds to a removed resource
              const removedResources = state.props.resources.filter((r) => removedIds.has(r.id));
              return !removedResources.some((resource) => hasResourceNode(node, resource));
            }
            return true;
          });

          // add new resources
          const addedResources = newProps.resources.filter((r) => addedIds.has(r.id));

          const { nodes: allNewNodes, edges } = computeNodesAndEdges(newProps);
          let firstNewNodeId: string | null = null;

          if (addedResources.length > 0) {
            const newNodes = allNewNodes
              .filter((node) => isAgentFlowResourceNode(node) && addedResources.some((r) => hasResourceNode(node, r)))
              .map((node, index) => {
                if (index === 0) firstNewNodeId = node.id;
                return {
                  ...node,
                  selected: index === 0, // select first new node
                };
              });
            updatedNodes.push(...newNodes);
          }

          // add new model
          const hasModel = updatedNodes.some(hasModelNode);
          if (willHaveModelNode && newProps.model && !hasModel) {
            const newModelNode = allNewNodes.find(hasModelNode);
            if (newModelNode) {
              firstNewNodeId ??= newModelNode.id;
              updatedNodes.push({
                ...newModelNode,
                selected: addedResources.length === 0,
              });
            }
          }

          // update state with selected node
          set({
            props: newProps,
            nodes: updatedNodes,
            edges,
            selectedNodeId: firstNewNodeId || state.selectedNodeId,
          });

          // call onSelectResource if we just added a node
          if (firstNewNodeId && newProps.onSelectResource) {
            newProps.onSelectResource(firstNewNodeId);
          }

          // auto-arrange
          if (addedIds.size > 0 || removedIds.size > 0 || modelChanged) {
            setTimeout(() => {
              get().autoArrange();
            }, 100);
          }
        } else {
          // data changes (including spans) - preserve positions, order, style
          const updatedNodes = state.nodes.map((node): AgentFlowCustomNode => {
            // Update agent node
            if (node.type === "agent") {
              return {
                ...node,
                data: {
                  ...node.data,
                  name: newProps.name,
                  description: newProps.description,
                },
              };
            }

            if (isAgentFlowResourceNode(node)) {
              // Update model node
              if (node.data.type === "model" && newProps.model) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    errors: newProps.resources.find((r) => hasResourceNode(node, r))?.errors,
                    name: newProps.model.name,
                    description: newProps.model.vendorName,
                    iconUrl: newProps.model.iconUrl,
                    hasGuardrails: newProps.model.hasGuardrails ?? false,
                    hasError: hasModelError(newProps.model, newProps.spans),
                    hasSuccess: hasModelSuccess(newProps.model, newProps.spans),
                    hasRunning: hasModelRunning(newProps.model, newProps.spans),
                  },
                };
              }

              // Update regular resource nodes
              const updatedResource = newProps.resources.find((r) => hasResourceNode(node, r));

              if (updatedResource) {
                const resourceIndex = newProps.resources.findIndex((r) => hasResourceNode(node, r));
                const newDraggable = Boolean(newProps.allowDragging);
                const newIsActive = newProps.activeResourceIds?.some(() => hasResourceNode(node, updatedResource)) ?? false;
                const newIconUrl = updatedResource.type === "tool" ? updatedResource.iconUrl : undefined;
                const newOrder = node.data.order ?? resourceIndex;
                const newHasBreakpoint = updatedResource.hasBreakpoint ?? false;
                const newIsCurrentBreakpoint = updatedResource.isCurrentBreakpoint ?? false;
                const newHasGuardrails = updatedResource.hasGuardrails ?? false;
                const newIsDisabled = updatedResource.isDisabled ?? false;

                return {
                  ...node,
                  data: {
                    ...node.data,
                    errors: newProps.resources.find((r) => hasResourceNode(node, r))?.errors,
                    name: updatedResource.name,
                    originalName: updatedResource.originalName,
                    description: updatedResource.description,
                    order: newOrder,
                    isActive: newIsActive,
                    iconUrl: newIconUrl,
                    hasBreakpoint: newHasBreakpoint,
                    isCurrentBreakpoint: newIsCurrentBreakpoint,
                    hasGuardrails: newHasGuardrails,
                    projectId: updatedResource.projectId,
                    hasError: hasResourceError(updatedResource, newProps.spans),
                    hasSuccess: hasResourceSuccess(updatedResource, newProps.spans),
                    hasRunning: hasResourceRunning(updatedResource, newProps.spans),
                    isDisabled: newIsDisabled,
                  },
                  draggable: newDraggable,
                };
              }
            }
            return node;
          });

          set({
            props: newProps,
            nodes: updatedNodes,
          });
        }
      },

      // computed state from props
      nodes: initialNodes,
      edges: initialEdges,

      // selection & UI
      selectedNodeId: null,
      setSelectedNodeId: (nodeId) => {
        set((state) => ({
          selectedNodeId: nodeId,
          nodes: state.nodes.map((node) => {
            const shouldBeSelected = node.id === nodeId;
            if (node.selected === shouldBeSelected) return node;
            return { ...node, selected: shouldBeSelected };
          }),
        }));
      },
      openMenuNodeId: null,
      setOpenMenuNodeId: (nodeId) => {
        set({ openMenuNodeId: nodeId });
      },
      // nodes
      updateNode: (nodeId, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? ({
                  ...node,
                  data: { ...node.data, ...updates },
                } as AgentFlowCustomNode)
              : node
          ),
        }));
      },

      deleteNode: (nodeId) => {
        const { props } = get();

        if (props.mode === "design") {
          // delete model
          if (nodeId === "model" && props.onRemoveModel) {
            props.onRemoveModel();
            return;
          }

          // delete other resources
          if (props.onRemoveResource) {
            const nodeToDelete = get().nodes.find((node) => node.id === nodeId);
            if (nodeToDelete && isAgentFlowResourceNode(nodeToDelete)) {
              const resourceToRemove = props.resources.find((r) => hasResourceNode(nodeToDelete, r));
              if (resourceToRemove) {
                props.onRemoveResource(resourceToRemove);
              }
            }
          }
        }
      },

      reorderNodes: (draggedNodeId, targetNodeId) => {
        set((state) => {
          const draggedNode = state.nodes.find((node) => node.id === draggedNodeId);
          const targetNode = state.nodes.find((node) => node.id === targetNodeId);

          if (!draggedNode || !targetNode || !isAgentFlowResourceNode(draggedNode) || !isAgentFlowResourceNode(targetNode)) {
            return state;
          }

          const sameTypeNodes = state.nodes
            .filter((node): node is AgentFlowResourceNode => node.type === "resource" && node.data.type === draggedNode.data.type)
            .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));
          const draggedIndex = sameTypeNodes.findIndex((node) => node.id === draggedNodeId);
          const targetIndex = sameTypeNodes.findIndex((node) => node.id === targetNodeId);

          if (draggedIndex === -1 || targetIndex === -1) return state;

          // reorder array
          const reorderedNodes = [...sameTypeNodes];
          const [draggedItem] = reorderedNodes.splice(draggedIndex, 1);
          reorderedNodes.splice(targetIndex, 0, draggedItem as AgentFlowResourceNode);

          // update order values
          const updatedNodes = state.nodes.map((node) => {
            if (isAgentFlowResourceNode(node) && node.data.type === draggedNode.data.type) {
              const newIndex = reorderedNodes.findIndex((n) => n.id === node.id);
              return {
                ...node,
                data: { ...node.data, order: newIndex },
              };
            }
            return node;
          });

          return { ...state, nodes: updatedNodes };
        });
      },

      insertNodeAfter: (draggedNodeId, targetNodeId) => {
        set((state) => {
          const draggedNode = state.nodes.find((node) => node.id === draggedNodeId);
          const targetNode = state.nodes.find((node) => node.id === targetNodeId);

          if (!draggedNode || !targetNode || !isAgentFlowResourceNode(draggedNode) || !isAgentFlowResourceNode(targetNode)) {
            return state;
          }

          const sameTypeNodes = state.nodes
            .filter((node): node is AgentFlowResourceNode => node.type === "resource" && node.data.type === draggedNode.data.type)
            .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

          // remove the dragged node
          const otherNodes = sameTypeNodes.filter((node) => node.id !== draggedNodeId);

          // find where to insert after the target
          const targetIndex = otherNodes.findIndex((node) => node.id === targetNodeId);
          if (targetIndex === -1) return state;

          // insert the dragged node
          const reorderedNodes = [...otherNodes.slice(0, targetIndex + 1), draggedNode, ...otherNodes.slice(targetIndex + 1)];

          // update order values
          const updatedNodes = state.nodes.map((node) => {
            if (isAgentFlowResourceNode(node) && node.data.type === draggedNode.data.type) {
              const newIndex = reorderedNodes.findIndex((n) => n.id === node.id);
              return {
                ...node,
                data: { ...node.data, order: newIndex },
              };
            }
            return node;
          });

          return { ...state, nodes: updatedNodes };
        });
      },
      onNodesChange: (changes) => {
        const { props, nodes } = get();

        // Check for node removals (keyboard delete)
        const removeChanges = changes.filter((change) => change.type === "remove");
        if (removeChanges.length > 0 && props.mode === "design") {
          // Handle each node removal through our deletion flow
          for (const removeChange of removeChanges) {
            const nodeToDelete = nodes.find((n) => n.id === removeChange.id);
            if (nodeToDelete) {
              // Prevent deletion of agent nodes
              if (nodeToDelete.type === "agent") {
                continue; // Skip this removal
              }

              // Prevent deletion of model nodes
              if (hasModelNode(nodeToDelete)) {
                continue; // Skip this removal
              }

              // Trigger our deletion callbacks for allowed deletions
              if (isAgentFlowResourceNode(nodeToDelete) && props.onRemoveResource) {
                const resourceToRemove = props.resources.find((r) => hasResourceNode(nodeToDelete, r));
                if (resourceToRemove) {
                  props.onRemoveResource(resourceToRemove);
                }
              }
            }
          }

          // Filter out remove changes for protected nodes (agent and model nodes)
          const allowedRemoveChanges = removeChanges.filter((removeChange) => {
            const nodeToDelete = nodes.find((n) => n.id === removeChange.id);
            if (!nodeToDelete) return true; // Allow removal if node not found

            // Prevent deletion of agent nodes
            if (nodeToDelete.type === "agent") return false;

            // Prevent deletion of model nodes
            if (hasModelNode(nodeToDelete)) return false;

            return true; // Allow deletion of other nodes
          });

          // If there are no allowed removals, return early
          if (allowedRemoveChanges.length === 0) {
            return;
          }

          // Apply only the allowed remove changes along with other changes
          const nonRemoveChanges = changes.filter((change) => change.type !== "remove");
          const filteredChanges = [...nonRemoveChanges, ...allowedRemoveChanges];

          if (filteredChanges.length === 0) return;

          set((state) => ({
            nodes: applyNodeChanges(filteredChanges, state.nodes) as AgentFlowCustomNode[],
          }));
          return;
        }

        // Check if there are selection changes
        const hasSelectionChanges = changes.some((change) => "selected" in change);

        if (hasSelectionChanges) {
          // If there are selection changes, let React Flow handle them
          // but also update our internal selectedNodeId
          const selectionChange = changes.find((change) => "selected" in change);
          if (selectionChange && "selected" in selectionChange) {
            const newSelectedId = selectionChange.selected ? selectionChange.id : null;
            set((state) => ({
              selectedNodeId: newSelectedId,
              nodes: applyNodeChanges(changes, state.nodes) as AgentFlowCustomNode[],
            }));
            return;
          }
        }

        // For non-selection changes, apply them normally
        const filteredChanges = changes.filter((change) => !("selected" in change));
        if (filteredChanges.length === 0) return;

        const currentSelectedId = get().selectedNodeId;
        set((state) => {
          const updatedNodes = applyNodeChanges(filteredChanges, state.nodes) as AgentFlowCustomNode[];

          return {
            nodes: updatedNodes.map((node) => ({
              ...node,
              selected: node.id === currentSelectedId,
            })),
          };
        });
      },

      // edges
      onEdgesChange: (changes) => {
        // Filter out removal changes for edges connected to agent nodes
        // Allow removal only when a connected non-agent node no longer exists (legitimate cleanup)
        const filteredChanges = changes.filter((change) => {
          // Only filter removal changes
          if (change.type !== "remove") return true;

          // Find the edge being removed
          const edgeToRemove = get().edges.find((edge) => edge.id === change.id);
          if (!edgeToRemove) return true;

          // Check if this edge is connected to an agent node
          const sourceNode = get().nodes.find((node) => node.id === edgeToRemove.source);
          const targetNode = get().nodes.find((node) => node.id === edgeToRemove.target);

          const isSourceAgent = sourceNode?.type === "agent";
          const isTargetAgent = targetNode?.type === "agent";

          // If neither node is an agent, allow removal
          if (!isSourceAgent && !isTargetAgent) {
            return true;
          }

          // If edge is connected to an agent node, check if this is legitimate cleanup
          // (i.e., the non-agent node has been deleted)
          if (isSourceAgent && !isTargetAgent) {
            // Agent -> Non-agent: allow removal only if target node no longer exists
            return !targetNode;
          }

          if (!isSourceAgent && isTargetAgent) {
            // Non-agent -> Agent: allow removal only if source node no longer exists
            return !sourceNode;
          }

          // Default: protect edges connected to agent nodes
          return false;
        });

        set((state) => ({
          edges: applyEdgeChanges(filteredChanges, state.edges) as AgentFlowCustomEdge[],
        }));
      },

      onConnect: (connection) => {
        set((state) => ({
          edges: addEdge(connection, state.edges),
        }));
      },

      // auto-arrange & drag
      isDragging: false,
      draggedNodeId: null,
      dragPreview: {
        draggedNodeId: null,
        insertAfterNodeId: null,
        previewPositions: {},
      },

      setDragging: (isDragging, draggedNodeId) => {
        set({ isDragging, draggedNodeId });
      },

      autoArrange: () => {
        const state = get();

        // Arrange nodes immediately without animation
        const arrangedNodes = autoArrangeNodes(state.nodes, state.edges).map((node) => ({
          ...node,
          selected: node.id === state.selectedNodeId,
        }));

        set({ nodes: arrangedNodes });
      },

      clearDragAndAutoArrange: () => {
        set({
          isDragging: false,
          draggedNodeId: null,
          dragPreview: {
            draggedNodeId: null,
            insertAfterNodeId: null,
            previewPositions: {},
          },
        });
        get().autoArrange();
      },

      setDragPreview: (draggedNodeId, insertAfterNodeId) => {
        const state = get();

        // clear drag preview and animations
        if (!draggedNodeId) {
          const previousDraggedNodeId = state.dragPreview.draggedNodeId;

          const clearedNodes = state.nodes.map((node) => {
            if (!isAgentFlowResourceNode(node) || !node.data.originalPosition) return node;
            return {
              ...node,
              data: { ...node.data, originalPosition: undefined },
            };
          });

          const clearedEdges = state.edges.map((edge) => {
            if (edge.source === previousDraggedNodeId || edge.target === previousDraggedNodeId) {
              return removeAnimationClasses([edge])[0] as AgentFlowCustomEdge;
            }
            return edge;
          });

          set({
            nodes: clearedNodes,
            edges: clearedEdges,
            dragPreview: {
              draggedNodeId: null,
              insertAfterNodeId: null,
              previewPositions: {},
            },
          });
          return;
        }

        // clear node and edge animations
        const clearedNodes = state.nodes.map((node) => (node.id === draggedNodeId ? clearNodeAnimations(node) : node));
        const clearedEdges = state.edges.map((edge) => {
          if (edge.source === draggedNodeId || edge.target === draggedNodeId) {
            return removeAnimationClasses([edge])[0] as AgentFlowCustomEdge;
          }
          return edge;
        });

        set({ nodes: clearedNodes, edges: clearedEdges });

        // start handling spacing, three cases:
        // 1. there was already spacing reserved, collapse it
        // 2. we don't need to create spacing because we're not in between nodes
        // 3. we need to create spacing between other nodes
        const updatedState = get();
        const draggedNode = updatedState.nodes.find((n) => n.id === draggedNodeId);
        if (!draggedNode || !isAgentFlowResourceNode(draggedNode)) return;

        // get all nodes of same type (including dragged) to find original index
        const allSameTypeNodes = updatedState.nodes
          .filter((node): node is AgentFlowResourceNode => node.type === "resource" && node.data.type === draggedNode.data.type)
          .sort((a, b) => (a.data.order || 0) - (b.data.order || 0));

        // find the original index of the dragged node in its group
        const originalIndex = allSameTypeNodes.findIndex((n) => n.id === draggedNodeId);

        const siblingNodes = allSameTypeNodes.filter((node) => node.id !== draggedNodeId);

        // cancel if no siblings
        if (siblingNodes.length === 0) return;

        // special handling for when there are only two nodes
        if (siblingNodes.length === 1) {
          const siblingNode = siblingNodes[0];

          const shouldInsertBefore = insertAfterNodeId === null;
          const insertIndex = shouldInsertBefore ? 0 : 1;

          const updatedAgentNode = updatedState.nodes.find(isAgentFlowAgentNode);
          if (!updatedAgentNode) return;

          const spacingPositions = calculateSpacingPositions(
            [siblingNode as AgentFlowResourceNode],
            insertIndex,
            draggedNode,
            updatedAgentNode
          );
          const { nodes: spacedNodes, edges: animatedEdges } = createSpacingState(
            updatedState.nodes,
            updatedState.edges,
            draggedNodeId,
            spacingPositions
          );

          set({
            nodes: spacedNodes,
            edges: animatedEdges,
            dragPreview: {
              draggedNodeId,
              insertAfterNodeId,
              previewPositions: {},
            },
          });
          return;
        }

        // find out where to insert the spacing
        let insertIndex = 0;
        if (insertAfterNodeId) {
          const afterIndex = siblingNodes.findIndex((n) => n.id === insertAfterNodeId);
          insertIndex = afterIndex >= 0 ? afterIndex + 1 : 0;
        }

        const isInsertingBetween = shouldCreateSpacing(insertIndex, siblingNodes.length, originalIndex >= 0 ? originalIndex : undefined);

        if (!isInsertingBetween) {
          // handle spacing collapse
          if (hasExistingSpacing(updatedState.nodes, draggedNode.data.type, draggedNodeId)) {
            const { nodes: collapsedNodes, edges: animatedEdges } = createCollapseState(
              updatedState.nodes,
              updatedState.edges,
              draggedNodeId,
              draggedNode.data.type
            );

            set({
              nodes: collapsedNodes,
              edges: animatedEdges,
              dragPreview: {
                draggedNodeId,
                insertAfterNodeId,
                previewPositions: {},
              },
            });
          } else {
            // no spacing needed, just store the original positions
            const nodesWithTracking = updatedState.nodes.map((node) => {
              if (isAgentFlowResourceNode(node) && node.data.type === draggedNode.data.type && node.id !== draggedNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    originalPosition: node.data.originalPosition ?? node.position,
                  },
                };
              }
              return node;
            });

            set({
              nodes: nodesWithTracking,
              dragPreview: {
                draggedNodeId,
                insertAfterNodeId,
                previewPositions: {},
              },
            });
          }
          return;
        }

        // apply spacing effect
        const agentNode = updatedState.nodes.find(isAgentFlowAgentNode);
        if (!agentNode) return;

        const spacingPositions = calculateSpacingPositions(siblingNodes, insertIndex, draggedNode, agentNode);
        const { nodes: spacedNodes, edges: animatedEdges } = createSpacingState(
          updatedState.nodes,
          updatedState.edges,
          draggedNodeId,
          spacingPositions
        );

        set({
          nodes: spacedNodes,
          edges: animatedEdges,
          dragPreview: {
            draggedNodeId,
            insertAfterNodeId,
            previewPositions: {},
          },
        });
      },

      expandAgent: (
        resourceId: string,
        agentDefinition: {
          rawAgentDefinition: Record<string, unknown> | null;
          agentName: string;
          agentDescription: string;
          agentResources: AgentFlowResource[];
          model: AgentFlowModel | null;
          error: string | null;
        }
      ) => {
        const currentState = get();
        const resourceNode = currentState.nodes.find((node) => isAgentFlowResourceNode(node) && node.id === resourceId);

        if (
          !resourceNode ||
          !isAgentFlowResourceNode(resourceNode) ||
          resourceNode.data.type !== "tool" ||
          resourceNode.data.projectType !== "Agent"
        ) {
          return;
        }

        if (!agentDefinition.rawAgentDefinition) {
          return;
        }

        const nestedResources = agentDefinition.agentResources;
        const nestedModel = agentDefinition.model;

        // Create new AgentFlowProps for the nested agent
        const nestedAgentProps: AgentFlowProps = {
          mode: currentState.props.mode,
          definition: agentDefinition.rawAgentDefinition,
          spans: [],
          name: resourceNode.data.name,
          description: resourceNode.data.description,
          model: nestedModel,
          resources: nestedResources,
          activeResourceIds: [],
        };

        const { nodes: nestedNodes, edges: nestedEdges } = computeNodesAndEdges(nestedAgentProps, resourceNode.id);

        const agentNode = nestedNodes.find((node) => node.type === "agent");
        if (!agentNode) return;

        const connectionEdge: AgentFlowCustomEdge = {
          id: `${resourceId}::${agentNode.id}`,
          source: resourceNode.id,
          target: agentNode.id,
          type: "default",
          sourceHandle: "right",
          targetHandle: "left",
          data: {
            label: null,
          },
          animated: false,
          selectable: false,
        };

        // Add the nested agent nodes and edges to the current state
        set((state) => {
          const newNodes = [...state.nodes, ...nestedNodes];
          const newEdges = [...state.edges, ...nestedEdges, connectionEdge];

          return {
            nodes: newNodes,
            edges: newEdges,
            selectedNodeId: agentNode.id,
          };
        });

        get().autoArrangeAndFitView();
      },

      collapseAgent: (resourceId: string) => {
        const state = get();

        // get all nodes where id starts with resourceId
        const nodesToRemove = state.nodes.filter((node) => node.id.startsWith(`${resourceId}${NODE_ID_DELIMITER}`));

        const edgesToRemove = state.edges.filter((edge) =>
          nodesToRemove.some((node) => edge.source === node.id || edge.target === node.id)
        );

        set({
          nodes: state.nodes.filter((node) => !nodesToRemove.some((n) => n.id === node.id)),
          edges: state.edges.filter((edge) => !edgesToRemove.some((e) => e.id === edge.id)),
        });

        get().autoArrangeAndFitView();
      },

      fitView: () => {
        window.dispatchEvent(new CustomEvent("agentFlowFitView"));
      },

      autoArrangeAndFitView: () => {
        const state = get();

        const allMeasured = state.nodes.every((node) => node.measured);

        if (allMeasured) {
          get().autoArrange();
          requestAnimationFrame(() => {
            get().fitView();
          });
        } else {
          const checkMeasurements = () => {
            const currentState = get();
            const nodesMeasured = currentState.nodes.every((node) => node.measured);

            if (nodesMeasured) {
              get().autoArrange();
              requestAnimationFrame(() => {
                get().fitView();
              });
            } else {
              requestAnimationFrame(checkMeasurements);
            }
          };

          requestAnimationFrame(checkMeasurements);
        }
      },
    };
  });

// context
type AgentFlowStoreType = ReturnType<typeof createAgentFlowStore>;
const AgentFlowContext = createContext<AgentFlowStoreType | null>(null);

export const AgentFlowProvider = ({ children, ...props }: AgentFlowProps & { children: React.ReactNode }) => {
  const [store] = useState(createAgentFlowStore(props));

  useEffect(() => {
    store.setState({ ...store.getState(), selectedNodeId: getSelectedNodeId(props, store.getState()) });
  }, []);

  useEffect(() => {
    store.getState().handlePropsUpdate(props);
  }, [props]);

  return React.createElement(AgentFlowContext.Provider, { value: store }, children);
};

// hooks
export function useAgentFlowStore(): AgentFlowStore;
export function useAgentFlowStore<T>(selector: (state: AgentFlowStore) => T): T;
export function useAgentFlowStore<T>(selector?: (state: AgentFlowStore) => T): AgentFlowStore | T {
  const store = useContext(AgentFlowContext);
  if (!store) {
    throw new Error("useAgentFlowStore must be used within AgentFlowProvider");
  }

  const selectorFn = selector ?? ((state: AgentFlowStore) => state as AgentFlowStore | T);
  return useStore(store, selectorFn);
}
export const useNodes = () => useAgentFlowStore((state) => state.nodes);
export const useEdges = () => useAgentFlowStore((state) => state.edges);
export const useSelectedNodeId = () => useAgentFlowStore((state) => state.selectedNodeId);
export const useSelectedNode = () => {
  return useAgentFlowStore((state) => {
    if (!state.selectedNodeId) return null;
    return state.nodes.find((node) => node.id === state.selectedNodeId) ?? null;
  });
};
