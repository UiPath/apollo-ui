import type React from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { DecisionGraphMinimap } from './DecisionGraphMinimap';
import { GRAPH_MINIMAP_SLOT_CLASS } from './decisionGraphStyles';
import type { DecisionGraphNode, DecisionGraphTarget } from './decisionGraphTypes';
import type { MinimapItem } from './minimapRows';
import { partsText } from './sentenceParts';
import type { SentenceRule } from './sentenceTypes';
import type { DecisionGraphLabels } from './useDecisionGraphStrings';

export interface DecisionGraphMinimapSlotProps {
  nodes: readonly DecisionGraphNode[];
  /** A table's rules as its body words them, read only while the minimap is open; without it the minimap lists decisions alone. */
  rules?: (decisionId: string) => readonly SentenceRule[];
  /** The decision the reader is on, null when none. */
  selected: string | null;
  onPick: (target: DecisionGraphTarget) => void;
  /** Where the floating launcher ends, in px from the frame's left edge. */
  onLauncherEnd: (px: number) => void;
  labels: DecisionGraphLabels;
  dataTestId: string;
}

/** A rule's outputs and every condition, as one searchable line. */
const ruleLabel = (rule: SentenceRule): string =>
  [rule.heading, rule.lead, ...rule.lines.map((line) => line.parts)]
    .map((parts) => partsText(parts))
    .join(' ');

/** The minimap's rows for the tree. */
const minimapOf = (
  nodes: readonly DecisionGraphNode[],
  rules: DecisionGraphMinimapSlotProps['rules'],
  labels: DecisionGraphLabels
): MinimapItem[] => {
  const toItem = (node: DecisionGraphNode): MinimapItem => {
    if (node.kind === 'reference') {
      return {
        kind: 'reference',
        referenceId: node.id,
        label: node.label,
        ariaLabel: labels.minimapReference(node.label),
        targetId: node.targetId,
      };
    }
    const ruleItems = (rules?.(node.id) ?? []).map(
      (rule): MinimapItem => ({
        kind: 'rule',
        decisionId: node.id,
        rowId: rule.rowId,
        label: ruleLabel(rule),
      })
    );
    return {
      kind: 'decision',
      decisionId: node.id,
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
  return nodes.map(toItem);
};

const targetOf = (item: MinimapItem): DecisionGraphTarget =>
  item.kind === 'rule'
    ? { decisionId: item.decisionId, rowId: item.rowId }
    : { decisionId: item.kind === 'decision' ? item.decisionId : item.targetId };

const ruleTotalOf = (nodes: readonly DecisionGraphNode[]): number =>
  nodes.reduce(
    (total, node) =>
      node.kind === 'decision' ? total + (node.ruleCount ?? 0) + ruleTotalOf(node.children) : total,
    0
  );

/** The minimap of the graph's decisions and rules, floating top-left. */
export const DecisionGraphMinimapSlot: React.FC<DecisionGraphMinimapSlotProps> = ({
  nodes,
  rules,
  selected,
  onPick,
  onLauncherEnd,
  labels,
  dataTestId,
}) => {
  const slotRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const measure = () => onLauncherEnd(slot.offsetLeft + slot.offsetWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    return () => observer.disconnect();
  }, [onLauncherEnd]);
  const items = useCallback(() => minimapOf(nodes, rules, labels), [nodes, rules, labels]);
  const ruleTotal = useMemo(() => ruleTotalOf(nodes), [nodes]);
  return (
    <div ref={slotRef} className={GRAPH_MINIMAP_SLOT_CLASS}>
      <DecisionGraphMinimap
        items={items}
        triggerLabel={labels.ruleCount(ruleTotal)}
        currentDecisionId={selected}
        onPick={(item) => onPick(targetOf(item))}
        labels={labels}
        dataTestId={dataTestId}
      />
    </div>
  );
};
