import type { ToolCallSpanData, ToolCallSpanNode } from '../tool-call/tool-call-model';

/** The span fields a tree message can carry for display. */
export type ChatTreeSpanData = ToolCallSpanData & {
  additionalInfo?: string;
  icon?: string;
  titleColor?: string;
  customIcon?: string;
  expanded?: boolean;
};

export type ChatTreeSpanNode = ToolCallSpanNode<ChatTreeSpanData>;

/** One row of a tree message, renderer-agnostic. */
export interface ChatTreeItem {
  id: string;
  title: string;
  /** Absent when the span has none, so no tooltip shows. */
  description?: string;
  icon?: string;
  expanded?: boolean;
  titleColor?: string;
  customIcon?: string;
  additionalInfo?: string;
  children?: ChatTreeItem[];
}

export interface ChatTreeStrings {
  unknown: string;
}

/**
 * A tree message's span as rows, as Material's tree renderer builds them: the span id (or the
 * position key) as id, its name as title, the description or type attribute as description
 * (none otherwise: a placeholder tooltip says nothing).
 * `transformChild` maps the children, so a host override applies at every level.
 */
export function toChatTreeItem(
  node: ChatTreeSpanNode,
  key: string,
  strings: ChatTreeStrings,
  transformChild: (child: ChatTreeSpanNode, key: string) => ChatTreeItem | null = (
    child,
    childKey
  ) => toChatTreeItem(child, childKey, strings)
): ChatTreeItem | null {
  const data = node?.data;
  if (!data) {
    return null;
  }

  const attributes = typeof data.attributes === 'object' ? data.attributes : undefined;
  const children =
    Array.isArray(node.children) && node.children.length > 0
      ? node.children
          .map((child, index) => transformChild(child, `${key}-${index}`))
          .filter((item): item is ChatTreeItem => item !== null)
      : undefined;

  return {
    id: data.id ?? key,
    title: node.name ?? strings.unknown,
    description:
      (attributes?.description as string | undefined) ??
      (attributes?.type as string | undefined) ??
      undefined,
    icon: data.icon,
    expanded: data.expanded,
    titleColor: data.titleColor,
    customIcon: data.customIcon,
    additionalInfo: data.additionalInfo || undefined,
    children,
  };
}

/** Rows open unless their span says `expanded: false`, as in Material. */
export function getExpandedTreeIds(items: readonly ChatTreeItem[]): string[] {
  const ids: string[] = [];
  const visit = (item: ChatTreeItem) => {
    if (item.expanded !== false) {
      ids.push(item.id);
    }
    item.children?.forEach(visit);
  };
  items.forEach(visit);
  return ids;
}
