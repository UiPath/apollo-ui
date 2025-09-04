import { type Node, type Edge, useNodes, useEdges, useReactFlow, type XYPosition } from "@xyflow/react";
import { Column, Row } from "@uipath/uix-core";
import { FloatingCanvasPanel } from "./FloatingCanvasPanel";
import { ApTypography } from "@uipath/portal-shell-react";
import { FontVariantToken } from "@uipath/apollo-core";

function safeStringify(obj: unknown, indent = 2): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      // Handle circular references
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return "[Circular Reference]";
        }
        seen.add(value);
      }

      // Handle React elements
      if (value && typeof value === "object" && "$$typeof" in value) {
        const componentName = value.type?.name || value.type?.displayName || "React.Component";
        return `[React Element: ${componentName}]`;
      }

      // Handle functions
      if (typeof value === "function") {
        return `[Function: ${value.name || "anonymous"}]`;
      }

      // Handle undefined (JSON.stringify skips undefined values)
      if (value === undefined) {
        return "[undefined]";
      }

      // Handle DOM elements
      if (value instanceof HTMLElement) {
        return `[HTMLElement: ${value.tagName}]`;
      }

      return value;
    },
    indent
  );
}

type NodeInfoContentProps = {
  node: Node;
  position: XYPosition;
  absPosition: XYPosition;
  width?: number;
  height?: number;
};

type EdgeInfoContentProps = {
  edge: Edge;
};

function NodeInfoContent({ node, position, absPosition: _absPosition, width, height }: NodeInfoContentProps) {
  const { id, type, selected, data } = node;

  return (
    <Column gap={4} pt={4} px={16}>
      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>ID:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{id}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Type:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{type || "default"}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Selected:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{selected ? "Yes" : "No"}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Position:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>
          ({position.x.toFixed(0)}, {position.y.toFixed(0)})
        </ApTypography>
      </Row>

      {width !== undefined && height !== undefined && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Size:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>
            {width.toFixed(0)} × {height.toFixed(0)}
          </ApTypography>
        </Row>
      )}

      {data && Object.keys(data).length > 0 && (
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM} color="var(--color-foreground-de-emp)">
            Data:
          </ApTypography>
          <pre
            style={{
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              padding: 8,
              background: "var(--color-background-secondary)",
              overflow: "auto",
              height: 300,
              color: "var(--color-foreground-de-emp)",
              userSelect: "text",
            }}
          >
            {typeof data === "string" ? data : safeStringify(data)}
          </pre>
        </Column>
      )}
    </Column>
  );
}

function EdgeInfoContent({ edge }: EdgeInfoContentProps) {
  const { id, type, source, target, sourceHandle, targetHandle, selected, data, label, animated, markerStart, markerEnd } = edge;

  return (
    <Column gap={4} pt={4} px={16}>
      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>ID:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{id}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Type:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{type || "default"}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Selected:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{selected ? "Yes" : "No"}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Source:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{source}</ApTypography>
      </Row>

      <Row gap={4}>
        <ApTypography variant={FontVariantToken.fontMonoM}>Target:</ApTypography>
        <ApTypography variant={FontVariantToken.fontMonoMBold}>{target}</ApTypography>
      </Row>

      {sourceHandle && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Source Handle:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>{sourceHandle}</ApTypography>
        </Row>
      )}

      {targetHandle && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Target Handle:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>{targetHandle}</ApTypography>
        </Row>
      )}

      {animated !== undefined && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Animated:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>{animated ? "Yes" : "No"}</ApTypography>
        </Row>
      )}

      {label && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Label:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>{typeof label === "string" ? label : "[React Element]"}</ApTypography>
        </Row>
      )}

      {(markerStart || markerEnd) && (
        <Row gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM}>Markers:</ApTypography>
          <ApTypography variant={FontVariantToken.fontMonoMBold}>
            {markerStart && markerEnd ? "Both ends" : markerStart ? "Start only" : "End only"}
          </ApTypography>
        </Row>
      )}

      {data && Object.keys(data).length > 0 && (
        <Column gap={4}>
          <ApTypography variant={FontVariantToken.fontMonoM} color="var(--color-foreground-de-emp)">
            Data:
          </ApTypography>
          <pre
            style={{
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              padding: 8,
              background: "var(--color-background-secondary)",
              overflow: "auto",
              height: 300,
              color: "var(--color-foreground-de-emp)",
              userSelect: "text",
            }}
          >
            {typeof data === "string" ? data : safeStringify(data)}
          </pre>
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
  /**
   * Custom filter function to determine which edges to inspect
   */
  edgeFilter?: (edge: Edge) => boolean;
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean;
  /**
   * Callback when inspector is closed
   */
  onClose?: () => void;
  /**
   * Whether to inspect nodes (default: true)
   */
  inspectNodes?: boolean;
  /**
   * Whether to inspect edges (default: true)
   */
  inspectEdges?: boolean;
};

export function NodeInspector({
  nodeFilter,
  edgeFilter,
  showCloseButton = false,
  onClose,
  inspectNodes = true,
  inspectEdges = true,
}: NodeInspectorProps = {}) {
  const { getInternalNode } = useReactFlow();
  const nodes = useNodes();
  const edges = useEdges();

  // Get selected nodes from nodes array instead of store internals
  const selectedNodeIds = new Set(nodes.filter((node) => node.selected).map((node) => node.id));

  // Get selected edges
  const selectedEdgeIds = new Set(edges.filter((edge) => edge.selected).map((edge) => edge.id));

  // Determine which nodes to show
  const nodesToShow = inspectNodes
    ? nodes.filter((node) => {
        // Apply custom filter if provided
        if (nodeFilter && !nodeFilter(node)) return false;

        // Show selected nodes by default
        return selectedNodeIds.has(node.id);
      })
    : [];

  // Determine which edges to show
  const edgesToShow = inspectEdges
    ? edges.filter((edge) => {
        // Apply custom filter if provided
        if (edgeFilter && !edgeFilter(edge)) return false;

        // Show selected edges by default
        return selectedEdgeIds.has(edge.id);
      })
    : [];

  if (nodesToShow.length === 0 && edgesToShow.length === 0) {
    return null;
  }

  return (
    <>
      {nodesToShow.map((node) => {
        const internalNode = getInternalNode(node.id);
        if (!internalNode) {
          return null;
        }

        const absPosition = internalNode.internals.positionAbsolute;
        const width = node.measured?.width ?? node.width;
        const height = node.measured?.height ?? node.height;

        return (
          <FloatingCanvasPanel
            key={`node-${node.id}`}
            nodeId={node.id}
            title="Node Inspector"
            placement="right-start"
            offset={10}
            onClose={showCloseButton ? onClose : undefined}
          >
            <NodeInfoContent node={node} position={node.position} absPosition={absPosition} width={width} height={height} />
          </FloatingCanvasPanel>
        );
      })}
      {edgesToShow.map((edge, index) => {
        // For edges, we'll position them relative to their source node if available
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const nodeId = sourceNode?.id || undefined;

        return (
          <FloatingCanvasPanel
            key={`edge-${edge.id}`}
            nodeId={nodeId}
            title="Edge Inspector"
            placement="right-start"
            offset={10 + (nodesToShow.length > 0 ? 420 : 0) + index * 420} // Offset multiple panels
            onClose={showCloseButton ? onClose : undefined}
          >
            <EdgeInfoContent edge={edge} />
          </FloatingCanvasPanel>
        );
      })}
    </>
  );
}
