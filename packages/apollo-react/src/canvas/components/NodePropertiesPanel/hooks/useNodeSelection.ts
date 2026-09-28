import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import {
  useNodes,
  useOnSelectionChange,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback, useEffect, useState } from 'react';
import type { ConfigurableNode } from '../NodePropertiesPanel.types';

function applySelection(nodes: Node[], nodeId: string): Node[] {
  return nodes.map((node) => {
    const shouldBeSelected = node.id === nodeId;
    if (node.selected === shouldBeSelected) return node;
    return { ...node, selected: shouldBeSelected };
  });
}

export function useNodeSelection(nodeId?: string, maintainSelection = true) {
  const nodes = useNodes();
  const { setNodes } = useReactFlow();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodeId || null);

  useOnSelectionChange({
    onChange: useCallback(
      ({ nodes: selectedNodes }) => {
        if (!nodeId) {
          if (selectedNodes.length === 1 && selectedNodes[0]) {
            setSelectedNodeId(selectedNodes[0].id);
          } else {
            setSelectedNodeId(null);
          }
        }
      },
      [nodeId]
    ),
  });

  useEffect(() => {
    if (maintainSelection && selectedNodeId) {
      setNodes((nds) => applySelection(nds, selectedNodeId));
    }
  }, [selectedNodeId, maintainSelection, setNodes]);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) as
    | ConfigurableNode
    | undefined;

  return {
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
  };
}

/**
 * Lightweight hook that only provides setSelectedNodeId without subscribing
 * to all nodes. Use this in node components that only need to trigger selection
 * without reading the full nodes array.
 */
export function useSetNodeSelection() {
  const { setNodes } = useReactFlow();

  const setSelectedNodeId = useCallback(
    (nodeId: string) => {
      setNodes((nds) => applySelection(nds, nodeId));
    },
    [setNodes]
  );

  return { setSelectedNodeId };
}
