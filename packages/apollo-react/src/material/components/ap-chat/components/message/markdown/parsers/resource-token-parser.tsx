import type { Root, Text } from 'mdast';
import { visit } from 'unist-util-visit';
import { AutopilotChatResourceItem } from '../../../../service';

const RESOURCE_TOKEN_PATTERN = /\[\[resource-token:(.*?)\]\]/g;

/**
 * Custom node type for resource chips in the mdast tree.
 */
interface ResourceChipNode {
  type: 'resource-chip';
  data: {
    hName: string;
    hProperties: {
      id: string;
      type: string;
      icon?: string;
      displayName: string;
    };
  };
}

type ChildNode = Text | ResourceChipNode;

/**
 * Creates a text node for the mdast tree.
 */
const createTextNode = (value: string): ChildNode => ({ type: 'text', value });

/**
 * Creates a resource-chip node with the given resource data.
 */
const createResourceChipNode = (resource: AutopilotChatResourceItem): ChildNode => ({
  type: 'resource-chip',
  data: {
    hName: 'resource-chip',
    hProperties: {
      id: resource.id,
      type: resource.type,
      icon: resource.icon,
      displayName: resource.displayName,
    },
  },
});

/**
 * Parses a JSON string into an AutopilotChatResourceItem.
 * Returns null if parsing fails.
 */
const parseResourceData = (json: string): AutopilotChatResourceItem | null => {
  try {
    const parsed = JSON.parse(json);
    if (!parsed?.id || !parsed?.type || !parsed?.displayName) return null;
    return parsed as AutopilotChatResourceItem;
  } catch (e) {
    console.error('[ResourceTokenPlugin] Failed to parse resource token:', e);
    return null;
  }
};

/**
 * Remark plugin that transforms [[resource-token:{...}]] markers into resource-chip elements.
 */
export function resourceTokenPlugin() {
  return (tree: Root) => {
    visit(tree, 'text', (node, _index, parent) => {
      if (!node.value || !parent) {
        return;
      }

      const text = node.value;
      const matches = [...text.matchAll(RESOURCE_TOKEN_PATTERN)];

      if (matches.length === 0) {
        return;
      }

      const newChildren: ChildNode[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const matchIndex = match.index ?? 0;
        const before = text.slice(lastIndex, matchIndex);

        if (before) {
          newChildren.push(createTextNode(before));
        }

        const resourceData = match[1] ? parseResourceData(match[1]) : null;
        newChildren.push(
          resourceData ? createResourceChipNode(resourceData) : createTextNode(match[0])
        );

        lastIndex = matchIndex + match[0].length;
      }

      const remaining = text.slice(lastIndex);
      if (remaining) {
        newChildren.push(createTextNode(remaining));
      }

      const nodeIndex = parent.children.indexOf(node);
      if (nodeIndex >= 0) {
        (parent.children as ChildNode[]).splice(nodeIndex, 1, ...newChildren);
      }
    });
  };
}
