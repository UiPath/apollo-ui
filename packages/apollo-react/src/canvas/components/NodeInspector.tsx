import { type Node, useNodes, useReactFlow, ViewportPortal, type XYPosition } from "@xyflow/react";
import { Column, Row } from "@uipath/uix-core";

type NodeInfoProps = {
  id: string;
  type: string;
  selected: boolean;
  position: XYPosition;
  absPosition: XYPosition;
  width?: number;
  height?: number;
  data: any;
};

const styles = {
  container: {
    position: "absolute" as const,
    color: "var(--color-foreground)",
    backgroundColor: "var(--color-background)",
    border: "1px solid var(--color-border)",
    borderRadius: "4px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    fontSize: "12px",
    fontFamily: "monospace",
    minWidth: "200px",
    maxWidth: "350px",
    maxHeight: "500px",
    overflowY: "auto" as const,
    zIndex: 1000,
  },
  title: {
    fontWeight: "bold" as const,
    fontSize: "14px",
  },
  label: {
    color: "var(--color-foreground-de-emp)",
    marginRight: "4px",
  },
  value: {
    color: "var(--color-foreground)",
  },
  dataContent: {
    backgroundColor: "var(--color-background-secondary)",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "11px",
    maxHeight: "300px",
    overflowY: "auto" as const,
    overflowX: "auto" as const,
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    border: "1px solid var(--color-border-de-emp",
  },
};

function NodeInfo({ id, type, selected, position, absPosition, width, height, data }: NodeInfoProps) {
  if (!width || !height) {
    return null;
  }

  // Position the info box to the right of the node with some offset
  const INFO_BOX_OFFSET = 10;
  const infoPosition = {
    x: absPosition.x + width + INFO_BOX_OFFSET,
    y: absPosition.y,
  };

  return (
    <Column
      p={12}
      gap={4}
      style={{
        ...styles.container,
        transform: `translate(${infoPosition.x}px, ${infoPosition.y}px)`,
      }}
    >
      <Row justify="space-between" align="center" pb={8} style={{ borderBottom: "1px solid var(--color-border)" }}>
        <span style={styles.title}>Node Inspector</span>
      </Row>

      <Row gap={4}>
        <span style={styles.label}>ID:</span>
        <span style={styles.value}>{id}</span>
      </Row>

      <Row gap={4}>
        <span style={styles.label}>Type:</span>
        <span style={styles.value}>{type}</span>
      </Row>

      <Row gap={4}>
        <span style={styles.label}>Selected:</span>
        <span style={styles.value}>{selected ? "Yes" : "No"}</span>
      </Row>

      <Row gap={4}>
        <span style={styles.label}>Position:</span>
        <span style={styles.value}>
          ({position.x.toFixed(0)}, {position.y.toFixed(0)})
        </span>
      </Row>

      <Row gap={4}>
        <span style={styles.label}>Size:</span>
        <span style={styles.value}>
          {width.toFixed(0)} × {height.toFixed(0)}
        </span>
      </Row>

      {data && Object.keys(data).length > 0 && (
        <Column mt={8} pt={8} gap={4} style={{ borderTop: "1px solid var(--color-border)" }}>
          <Row justify="space-between" align="center">
            <span style={styles.label}>Data:</span>
          </Row>
          <div style={styles.dataContent}>{JSON.stringify(data, null, 2)}</div>
        </Column>
      )}
    </Column>
  );
}

export type NodeInspectorProps = {
  /**
   * Custom filter function to determine which nodes to inspect
   */
  nodeFilter?: (node: Node) => boolean;
};

export function NodeInspector({ nodeFilter }: NodeInspectorProps = {}) {
  const { getInternalNode } = useReactFlow();
  const nodes = useNodes();

  // Get selected nodes from nodes array instead of store internals
  const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));

  // Determine which nodes to show
  const nodesToShow = nodes.filter((node) => {
    // Apply custom filter if provided
    if (nodeFilter && !nodeFilter(node)) return false;

    // Show selected nodes by default
    return selectedNodeIds.has(node.id);
  });

  if (nodesToShow.length === 0) {
    return null;
  }

  return (
    <ViewportPortal>
      <div className="nowheel nodrag">
        {nodesToShow.map((node) => {
          const internalNode = getInternalNode(node.id);
          if (!internalNode) {
            return null;
          }

          const absPosition = internalNode.internals.positionAbsolute;

          return (
            <NodeInfo
              key={node.id}
              id={node.id}
              selected={!!node.selected}
              type={node.type || "default"}
              position={node.position}
              absPosition={absPosition}
              width={node.measured?.width ?? node.width}
              height={node.measured?.height ?? node.height}
              data={node.data}
            />
          );
        })}
      </div>
    </ViewportPortal>
  );
}
