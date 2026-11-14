/** What holds `node` where it renders: the slot it is assigned to, a shadow root's host, else its parent. */
export const renderedParentOf = (node: Node): Node | null => {
  if (node instanceof ShadowRoot) return node.host;
  return (node instanceof Element ? node.assignedSlot : null) ?? node.parentNode;
};

/** The document and shadow roots of everything `node` is rendered inside: where a scroll of anything holding it reaches. */
export const scrollRootsOf = (node: Node): Node[] => {
  const roots = new Set<Node>();
  for (let at: Node | null = node; at; at = renderedParentOf(at)) roots.add(at.getRootNode());
  return [...roots];
};
