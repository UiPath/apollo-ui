import type { Edge, Node } from '@uipath/apollo-react/canvas/xyflow/react';
import type { SuggestionType } from '../../types';
import type { ChangeKind, DiffHighlight } from './CanvasDiffView.types';

const SUGGESTION_BY_KIND: Record<ChangeKind, SuggestionType> = {
  added: 'add',
  changed: 'update',
  removed: 'delete',
};

function withSuggestion<T extends Node | Edge>(element: T, kinds: Map<string, ChangeKind>): T {
  const kind = kinds.get(element.id);
  if (!kind) return element;
  return {
    ...element,
    data: { ...element.data, suggestionType: SUGGESTION_BY_KIND[kind] },
  };
}

/**
 * Sets `data.suggestionType` on every node and edge in `highlight` (added → `add`, changed →
 * `update`, removed → `delete`), which `BaseNode` and `CanvasEdge` draw as the suggestion
 * border and stroke. Pass a pane's `ctx.highlight`, which already holds only its side's
 * changes. Unchanged elements are returned by reference.
 */
export function applyDiffHighlight<N extends Node, E extends Edge>(
  nodes: readonly N[],
  edges: readonly E[],
  highlight: DiffHighlight
): { nodes: N[]; edges: E[] } {
  return {
    nodes: nodes.map((node) => withSuggestion(node, highlight.nodeKind)),
    edges: edges.map((edge) => withSuggestion(edge, highlight.edgeKind)),
  };
}
