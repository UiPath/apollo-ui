import type React from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { DecisionGraphMinimap } from './DecisionGraphMinimap';
import { GRAPH_TOOLBAR_CLASS } from './decisionGraphStyles';
import type {
  DecisionGraphNode,
  DecisionGraphRule,
  DecisionGraphTarget,
} from './decisionGraphTypes';
import type { MinimapItem } from './minimapRows';
import type { DecisionGraphLabels } from './useDecisionGraphStrings';

export interface DecisionGraphMinimapSlotProps {
  nodes: readonly DecisionGraphNode[];
  /** A table's rules as the minimap lists them, read only while it is open; without it the minimap lists decisions alone. */
  rules?: (decisionId: string) => readonly DecisionGraphRule[];
  /** The decision the reader is on, null when none. */
  selected: string | null;
  onPick: (target: DecisionGraphTarget) => void;
  labels: DecisionGraphLabels;
  dataTestId: string;
}

const decisionRowId = (decisionId: string) => `decision:${decisionId}`;

/** The minimap's rows for the tree, and where each one goes. */
const minimapOf = (
  nodes: readonly DecisionGraphNode[],
  rules: DecisionGraphMinimapSlotProps['rules'],
  labels: DecisionGraphLabels
): { items: MinimapItem[]; targets: ReadonlyMap<string, DecisionGraphTarget> } => {
  const targets = new Map<string, DecisionGraphTarget>();
  const toItem = (node: DecisionGraphNode): MinimapItem => {
    if (node.kind === 'reference') {
      const id = `reference:${node.id}`;
      targets.set(id, { decisionId: node.targetId });
      return {
        id,
        kind: 'reference',
        label: node.label,
        ariaLabel: labels.minimapReference(node.label),
        targetId: node.targetId,
      };
    }
    const id = decisionRowId(node.id);
    targets.set(id, { decisionId: node.id });
    const ruleItems = (rules?.(node.id) ?? []).map((rule): MinimapItem => {
      const ruleId = `rule:${node.id}:${rule.rowId}`;
      targets.set(ruleId, { decisionId: node.id, rowId: rule.rowId });
      return { id: ruleId, kind: 'rule', label: rule.label };
    });
    return {
      id,
      kind: 'decision',
      label: node.label,
      count:
        node.ruleCount === undefined
          ? null
          : {
              meta: String(node.ruleCount),
              ariaLabel: labels.minimapDecision(node.label, node.ruleCount),
            },
      children: [...ruleItems, ...node.children.map(toItem)],
    };
  };
  return { items: nodes.map(toItem), targets };
};

const ruleTotalOf = (nodes: readonly DecisionGraphNode[]): number =>
  nodes.reduce(
    (total, node) =>
      node.kind === 'decision' ? total + (node.ruleCount ?? 0) + ruleTotalOf(node.children) : total,
    0
  );

/** The graph's toolbar row, holding the minimap of its decisions and rules. */
export const DecisionGraphMinimapSlot: React.FC<DecisionGraphMinimapSlotProps> = ({
  nodes,
  rules,
  selected,
  onPick,
  labels,
  dataTestId,
}) => {
  const targetsRef = useRef<ReadonlyMap<string, DecisionGraphTarget>>(new Map());
  const items = useCallback(() => {
    const built = minimapOf(nodes, rules, labels);
    targetsRef.current = built.targets;
    return built.items;
  }, [nodes, rules, labels]);
  const ruleTotal = useMemo(() => ruleTotalOf(nodes), [nodes]);
  return (
    <div className={GRAPH_TOOLBAR_CLASS}>
      <DecisionGraphMinimap
        items={items}
        triggerLabel={labels.ruleCount(ruleTotal)}
        currentId={selected === null ? null : decisionRowId(selected)}
        onPick={(item) => {
          const target = targetsRef.current.get(item.id);
          if (target) onPick(target);
        }}
        labels={labels}
        dataTestId={dataTestId}
      />
    </div>
  );
};
