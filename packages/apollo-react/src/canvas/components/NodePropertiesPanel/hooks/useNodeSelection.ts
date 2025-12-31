import { useState, useCallback, useEffect } from 'react';
import {
  useNodes,
  useOnSelectionChange,
  useReactFlow,
} from '@uipath/apollo-react/canvas/xyflow/react';
import type { ConfigurableNode } from '../NodePropertiesPanel.types';

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
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))
      );
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
