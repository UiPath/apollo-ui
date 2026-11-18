import type {
  DecisionGraphAction,
  DecisionGraphMove,
  DecisionGraphPlace,
} from '../decisionGraphActionTypes';
import { decisionIdOf } from '../decisionGraphPositions';
import type { DecisionGraphDecisionNode, DecisionGraphNode } from '../decisionGraphTypes';

export type FixtureLogic = 'table' | 'literal';

export type FixtureRefusal = 'duplicateName' | 'loop';

interface FixtureDecision {
  node: Pick<DecisionGraphDecisionNode, 'label' | 'logic' | 'mark'>;
  inputs: readonly string[];
  notes: readonly string[];
}

/** A host's graph as the decisions it holds, each with its inputs, and its top-level order. */
export interface FixtureGraph {
  decisions: ReadonlyMap<string, FixtureDecision>;
  top: readonly string[];
  added: number;
}

export const graphOf = (nodes: readonly DecisionGraphNode[]): FixtureGraph => {
  const decisions = new Map<string, FixtureDecision>();
  const visit = (node: DecisionGraphNode) => {
    if (node.kind !== 'decision') return;
    const { label, logic, mark } = node;
    decisions.set(node.id, {
      node: { label, logic, mark },
      inputs: node.children.map(decisionIdOf),
      notes: [],
    });
    for (const child of node.children) visit(child);
  };
  for (const node of nodes) visit(node);
  return { decisions, top: nodes.map(decisionIdOf), added: 0 };
};

/** The graph drawn: each decision in full where first reached, a reference wherever else. */
export const nodesOf = (graph: FixtureGraph): DecisionGraphNode[] => {
  const drawn = new Set<string>();
  const draw = (id: string, at: string): DecisionGraphNode[] => {
    const decision = graph.decisions.get(id);
    if (!decision) return [];
    if (drawn.has(id)) {
      return [{ kind: 'reference', id: `${at}-${id}`, label: decision.node.label, targetId: id }];
    }
    drawn.add(id);
    return [
      {
        kind: 'decision',
        id,
        ...decision.node,
        children: decision.inputs.flatMap((input) => draw(input, id)),
      },
    ];
  };
  return graph.top.flatMap((id) => draw(id, 'top'));
};

const requires = (graph: FixtureGraph, from: string, target: string): boolean => {
  const seen = new Set<string>();
  const visit = (id: string): boolean => {
    if (id === target) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return (graph.decisions.get(id)?.inputs ?? []).some(visit);
  };
  return visit(from);
};

const withDecision = (
  graph: FixtureGraph,
  id: string,
  change: (decision: FixtureDecision) => FixtureDecision
): FixtureGraph => {
  const decision = graph.decisions.get(id);
  if (!decision) return graph;
  return { ...graph, decisions: new Map(graph.decisions).set(id, change(decision)) };
};

const inserted = (list: readonly string[], id: string, index: number): string[] => {
  const rest = list.filter((item) => item !== id);
  return [...rest.slice(0, index), id, ...rest.slice(index)];
};

/** The graph with every decision nothing reaches put back at the top. */
const settled = (graph: FixtureGraph): FixtureGraph => {
  const reached = new Set<string>();
  const visit = (id: string) => {
    if (reached.has(id)) return;
    reached.add(id);
    for (const input of graph.decisions.get(id)?.inputs ?? []) visit(input);
  };
  for (const id of graph.top) visit(id);
  const lost = [...graph.decisions.keys()].filter((id) => !reached.has(id));
  return lost.length === 0 ? graph : { ...graph, top: [...graph.top, ...lost] };
};

const listAt = (graph: FixtureGraph, place: DecisionGraphPlace): readonly string[] =>
  place.kind === 'top' ? graph.top : (graph.decisions.get(place.parentId)?.inputs ?? []);

const withList = (
  graph: FixtureGraph,
  place: DecisionGraphPlace,
  list: readonly string[]
): FixtureGraph =>
  place.kind === 'top'
    ? { ...graph, top: list }
    : withDecision(graph, place.parentId, (decision) => ({ ...decision, inputs: list }));

const loops = (graph: FixtureGraph, place: DecisionGraphPlace, id: string): boolean =>
  place.kind === 'under' && requires(graph, id, place.parentId);

export const moved = (
  graph: FixtureGraph,
  move: DecisionGraphMove
): FixtureGraph | FixtureRefusal => {
  if (loops(graph, move.to, move.decisionId)) return 'loop';
  const from = listAt(graph, move.from).filter((_, index) => index !== move.from.index);
  const left = withList(graph, move.from, from);
  return settled(
    withList(left, move.to, inserted(listAt(left, move.to), move.decisionId, move.to.index))
  );
};

/** The host's actions on a fixture graph, each applying its change through `update` or refusing it. */
export const fixtureActions = (
  graph: FixtureGraph,
  update: (next: FixtureGraph) => void
): DecisionGraphAction<FixtureRefusal, FixtureLogic>[] => {
  const apply = (next: FixtureGraph | FixtureRefusal): FixtureRefusal | void => {
    if (typeof next === 'string') return next;
    update(next);
  };
  return [
    {
      kind: 'rename',
      onRename: (decisionId, name) => {
        const taken = [...graph.decisions].some(
          ([id, decision]) => id !== decisionId && decision.node.label === name
        );
        return apply(
          taken
            ? 'duplicateName'
            : withDecision(graph, decisionId, (decision) => ({
                ...decision,
                node: { ...decision.node, label: name },
              }))
        );
      },
    },
    {
      kind: 'delete',
      onDelete: (decisionId) => {
        const decisions = new Map(graph.decisions);
        decisions.delete(decisionId);
        for (const [id, decision] of decisions) {
          decisions.set(id, {
            ...decision,
            inputs: decision.inputs.filter((input) => input !== decisionId),
          });
        }
        update(settled({ ...graph, decisions, top: graph.top.filter((id) => id !== decisionId) }));
      },
    },
    {
      kind: 'add',
      onAdd: (place) => {
        const added = graph.added + 1;
        const id = `new-${added}`;
        const decisions = new Map(graph.decisions).set(id, {
          node: { label: `New decision ${added}`, logic: { kind: 'other' } },
          inputs: [],
          notes: [],
        });
        const next = { ...graph, decisions, added };
        update(withList(next, place, inserted(listAt(next, place), id, place.index)));
      },
    },
    {
      kind: 'chooseInputs',
      onChooseInputs: (decisionId, inputIds) => {
        return apply(
          inputIds.some((id) => requires(graph, id, decisionId))
            ? 'loop'
            : settled(
                withDecision(graph, decisionId, (decision) => ({ ...decision, inputs: inputIds }))
              )
        );
      },
    },
    {
      kind: 'chooseUsers',
      onChooseUsers: (decisionId, userIds) => {
        if (userIds.some((id) => requires(graph, decisionId, id))) return apply('loop');
        let next = graph;
        for (const id of graph.decisions.keys()) {
          next = withDecision(next, id, (decision) => {
            const uses = decision.inputs.includes(decisionId);
            if (userIds.includes(id) === uses) return decision;
            return {
              ...decision,
              inputs: uses
                ? decision.inputs.filter((input) => input !== decisionId)
                : [...decision.inputs, decisionId],
            };
          });
        }
        return apply(settled(next));
      },
    },
    {
      kind: 'stopUsing',
      onStopUsing: (decisionId, userId) =>
        apply(
          settled(
            withDecision(graph, userId, (decision) => ({
              ...decision,
              inputs: decision.inputs.filter((input) => input !== decisionId),
            }))
          )
        ),
    },
    { kind: 'move', onMove: (move) => apply(moved(graph, move)) },
    {
      kind: 'changeLogic',
      logicOptions: (decisionId) =>
        graph.decisions.get(decisionId)?.node.logic.kind === 'table'
          ? [{ logic: 'literal', label: 'Literal expression' }]
          : [{ logic: 'table', label: 'Decision table' }],
      onChangeLogic: (decisionId, logic) =>
        update(
          withDecision(graph, decisionId, (decision) => ({
            ...decision,
            node: {
              ...decision.node,
              logic:
                logic === 'table'
                  ? { kind: 'table', hitPolicy: 'Unique', ruleCount: 0 }
                  : { kind: 'other' },
            },
          }))
        ),
    },
    {
      kind: 'addNote',
      onAddNote: (decisionId, text) =>
        update(
          withDecision(graph, decisionId, (decision) => ({
            ...decision,
            notes: [...decision.notes, text],
          }))
        ),
    },
  ];
};

export const wordFixtureRefusal = (refusal: FixtureRefusal): string =>
  refusal === 'duplicateName'
    ? 'Another decision already has this name'
    : 'That would make a decision use itself';
