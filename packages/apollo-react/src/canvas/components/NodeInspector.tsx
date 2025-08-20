import { type Node, useNodes, useReactFlow, type XYPosition } from "@xyflow/react";
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

export type NodeInspectorProps = {
  /**
   * Custom filter function to determine which nodes to inspect
   */
  nodeFilter?: (node: Node) => boolean;
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean;
  /**
   * Callback when inspector is closed
   */
  onClose?: () => void;
};

export function NodeInspector({ nodeFilter, showCloseButton = false, onClose }: NodeInspectorProps = {}) {
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
            key={node.id}
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
    </>
  );
}
