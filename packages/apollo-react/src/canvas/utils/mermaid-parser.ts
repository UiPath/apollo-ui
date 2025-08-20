import type { Edge, Node } from "@xyflow/react";

// @ts-expect-error mermaid isn't installed to avoid build errors for now
import mermaid from "mermaid";
import sanitizeHtml from "sanitize-html";

interface IMermaidNodeDefinition {
  id: string;
  text: string;
  type?: string;
  [key: string]: unknown; // Allow additional properties from mermaid
}

interface IMermaidEdgeDefinition {
  start: string;
  end: string;
  text?: string;
}

export interface MermaidParserResult {
  nodes: Node[];
  edges: Edge[];
}

function ensureArray<T>(data: Map<string, T> | Record<string, T> | T[] | null | undefined): T[] {
  if (Array.isArray(data)) {
    return data;
  } else if (data instanceof Map) {
    return Array.from(data.values());
  } else if (data && typeof data === "object") {
    return Object.values(data);
  }
  return [];
}

function getNodeType(nodeLabel: string): string {
  const lowerLabel = nodeLabel.toLowerCase();
  if (lowerLabel.includes("agent")) return "agent";
  if (lowerLabel.includes("tool") || lowerLabel.includes("function")) return "resource";
  if (lowerLabel.includes("context") || lowerLabel.includes("knowledge")) return "resource";
  if (lowerLabel.includes("escalation") || lowerLabel.includes("human")) return "resource";
  return "flow"; // For start, end, and other flow nodes
}

export async function mermaidToReactFlow(mermaidText: string): Promise<MermaidParserResult> {
  try {
    // Initialize mermaid only once
    mermaid.initialize({ startOnLoad: false });

    // First validate the diagram syntax
    const parseResult = await mermaid.parse(mermaidText, { suppressErrors: true });
    if (!parseResult) {
      throw new Error("Invalid mermaid syntax");
    }

    // Get the diagram using the mermaidAPI
    const diagram = await (
      mermaid as {
        mermaidAPI: { getDiagramFromText: (text: string) => Promise<{ db?: { getVertices: () => unknown; getEdges: () => unknown } }> };
      }
    ).mermaidAPI.getDiagramFromText(mermaidText);

    let rawNodes: IMermaidNodeDefinition[] = [];
    let rawEdges: IMermaidEdgeDefinition[] = [];

    if (diagram && diagram.db) {
      rawNodes = ensureArray<IMermaidNodeDefinition>(
        diagram.db.getVertices() as
          | IMermaidNodeDefinition[]
          | Map<string, IMermaidNodeDefinition>
          | Record<string, IMermaidNodeDefinition>
          | null
          | undefined
      );
      rawEdges = ensureArray<IMermaidEdgeDefinition>(
        diagram.db.getEdges() as
          | IMermaidEdgeDefinition[]
          | Map<string, IMermaidEdgeDefinition>
          | Record<string, IMermaidEdgeDefinition>
          | null
          | undefined
      );
    }

    if (rawNodes.length === 0) {
      throw new Error("Unable to extract nodes from diagram");
    }

    // Process edges with proper formatting
    const edges: Edge[] = rawEdges.map(
      (mermaidEdge: IMermaidEdgeDefinition) =>
        ({
          id: crypto.randomUUID(),
          source: mermaidEdge.start,
          target: mermaidEdge.end,
          type: "default",
          label: mermaidEdge.text,
          animated: false,
          markerEnd: "arrow",
          style: {
            stroke: "var(--color-foreground-de-emp)",
            strokeWidth: 1,
          },
          data: {
            label: mermaidEdge.text,
            raw: mermaidEdge,
          },
        }) as Edge
    );

    // Process nodes with proper types and cleaned labels
    const nodes: Node[] = rawNodes.map((mermaidNode: IMermaidNodeDefinition) => {
      // Clean label from HTML if needed
      let label = mermaidNode.text;
      if (typeof label === "string" && label.includes("<")) {
        label = sanitizeHtml(label, {
          allowedTags: [],
          allowedAttributes: {},
        });
      }

      const nodeType = getNodeType(label);

      return {
        id: mermaidNode.id,
        position: { x: 0, y: 0 }, // Will be repositioned by layout algorithm
        type: nodeType,
        data: {
          label,
          raw: mermaidNode,
        },
      };
    });

    return {
      nodes,
      edges,
    };
  } catch {
    return {
      nodes: [],
      edges: [],
    };
  }
}
