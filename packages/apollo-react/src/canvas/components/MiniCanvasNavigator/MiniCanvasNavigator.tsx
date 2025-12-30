import React, { useMemo, memo } from 'react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import type { Node, NodeTypes } from '@uipath/apollo-react/canvas/xyflow/react';
import { BaseCanvas } from '../BaseCanvas';
import type { CanvasLevel } from '../../types/canvas.types';

interface MiniCanvasNavigatorProps {
  previousCanvas: CanvasLevel;
  currentCanvasId?: string;
  nodeTypes: NodeTypes;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

export const MiniCanvasNavigator = memo(
  ({ previousCanvas, currentCanvasId, nodeTypes, onNodeClick }: MiniCanvasNavigatorProps) => {
    const nodes = useMemo(() => {
      return previousCanvas.nodes.map((node) => {
        const isSelected = node.data?.childCanvasId === currentCanvasId;

        return {
          ...node,
          selected: isSelected,
          style: {
            ...node.style,
            cursor: node.data?.childCanvasId ? 'pointer' : 'default',
            opacity: node.data?.childCanvasId ? (isSelected ? 1 : 0.8) : 0.6,
          },
        };
      });
    }, [previousCanvas.nodes, currentCanvasId]);

    return (
      <div
        style={{
          width: 300,
          height: 200,
          background: 'var(--uix-canvas-background)',
          border: '1px solid var(--uix-canvas-border-grid)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <ReactFlowProvider>
          <BaseCanvas
            key={previousCanvas.id}
            nodes={nodes}
            edges={previousCanvas.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1, duration: 0 }}
            mode="view"
            showBackground={false}
            onNodeClick={onNodeClick}
            panOnDrag={false}
            zoomOnScroll={false}
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          />
        </ReactFlowProvider>
      </div>
    );
  }
);

MiniCanvasNavigator.displayName = 'MiniCanvasNavigator';
