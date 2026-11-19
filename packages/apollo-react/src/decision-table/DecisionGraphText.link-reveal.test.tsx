import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { type Mock, vi } from 'vitest';
import {
  COLUMN_TYPES,
  GRID_SENTENCE_COLUMNS,
  GRID_SENTENCE_POLICY,
  GRID_SENTENCE_RULES,
  HIT_POLICIES,
} from './__fixtures__/sentences.fixtures';
import { DecisionGraphText } from './DecisionGraphText';
import type { DecisionGraphNode, DecisionGraphTarget } from './decisionGraphTypes';
import type { SentenceRule } from './sentenceTypes';

const leaf = (id: string): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label: id,
  logic: { kind: 'other' },
  children: [],
});

const rulesLinkedTo = (decisionId: string): SentenceRule[] =>
  GRID_SENTENCE_RULES.map((rule) => ({
    ...rule,
    lead: rule.lead.map((part) =>
      typeof part !== 'string' && part.kind === 'input' && part.columnId === 'income'
        ? { ...part, producedBy: decisionId }
        : part
    ),
  }));

const Host = ({
  linkTo,
  initial,
  onOpenDecision,
  onReveal,
}: {
  linkTo: string;
  initial: ReadonlySet<string>;
  onOpenDecision: (decisionId: string) => void;
  onReveal: (target: DecisionGraphTarget) => void;
}) => {
  const [expanded, setExpanded] = useState(initial);
  const [selected, setSelected] = useState<{ kind: 'rule'; rowId: string } | null>(null);
  return (
    <DecisionGraphText
      nodes={[leaf('a'), leaf('income')]}
      expansion={{ expanded, onChange: setExpanded }}
      onOpenDecision={onOpenDecision}
      mode={{ kind: 'select', selected: null, onReveal }}
      renderBody={(decisionId) =>
        decisionId === 'a'
          ? {
              kind: 'table',
              text: {
                table: {
                  rules: rulesLinkedTo(linkTo),
                  ...GRID_SENTENCE_COLUMNS,
                  hitPolicy: GRID_SENTENCE_POLICY,
                },
                hitPolicies: HIT_POLICIES,
                columnTypes: COLUMN_TYPES,
                ariaLabel: 'Rules of a',
                dataTestId: 'text-a',
                mode: {
                  kind: 'select',
                  selected,
                  onSelect: (next) => setSelected(next?.kind === 'rule' ? next : null),
                },
              },
            }
          : { kind: 'other', content: <p data-testid={`body-${decisionId}`}>{decisionId}</p> }
      }
      dataTestId="graph"
    />
  );
};

const link = () =>
  within(screen.getByTestId('text-a-row-r1')).getByRole('button', {
    name: "Open income's decision",
  });
const nextFrame = () => act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

const nearObservers: NearObserver[] = [];

class NearObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];
  readonly #callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
    nearObservers.push(this);
  }
  leave(target: Element) {
    const rect = target.getBoundingClientRect();
    this.#callback(
      [
        {
          target,
          isIntersecting: false,
          intersectionRatio: 0,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: 0,
        },
      ],
      this
    );
  }
  observe(target: Element) {
    const rect = target.getBoundingClientRect();
    this.#callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: 0,
        },
      ],
      this
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

let animate: Mock;
let scrollIntoView: Mock<Element['scrollIntoView']>;
let scrollTo: Mock;
beforeEach(() => {
  scrollTo = vi.fn();
  HTMLElement.prototype.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];
  animate = vi.fn();
  scrollIntoView = vi.fn<Element['scrollIntoView']>();
  HTMLElement.prototype.animate = animate;
  Element.prototype.scrollIntoView = scrollIntoView;
  vi.stubGlobal('IntersectionObserver', NearObserver);
});
afterEach(() => {
  nearObservers.length = 0;
  vi.unstubAllGlobals();
});

const setup = (linkTo: string, initial: readonly string[]) => {
  const onOpenDecision = vi.fn();
  const onReveal = vi.fn();
  render(
    <Host
      linkTo={linkTo}
      initial={new Set(initial)}
      onOpenDecision={onOpenDecision}
      onReveal={onReveal}
    />
  );
  return { onOpenDecision, onReveal };
};

describe('a decision link inside a card body', () => {
  it('scrolls to and flashes the linked decision on a click, leaving focus on the link', async () => {
    const { onOpenDecision, onReveal } = setup('income', ['a', 'income']);
    const target = link();
    await userEvent.click(target);
    await nextFrame();
    expect(scrollTo.mock.contexts).toEqual([screen.getByTestId('graph-scroller')]);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(animate.mock.contexts).toContain(screen.getByTestId('graph-decision-income'));
    expect(document.activeElement).toBe(target);
    expect(onReveal.mock.calls).toEqual([[{ kind: 'decision', decisionId: 'income' }]]);
    expect(onOpenDecision).not.toHaveBeenCalled();
  });

  it('reserves the minimap launcher in the scroller so a reveal leaves the heading clear of it', () => {
    const left = vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockReturnValue(15);
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(140);
    setup('income', ['a', 'income']);
    expect(screen.getByTestId('graph-scroller').style.scrollPaddingInlineStart).toBe('167px');
    left.mockRestore();
    width.mockRestore();
  });

  it('keeps the clicked link mounted and focused when its card leaves the window', async () => {
    setup('income', ['a', 'income']);
    const target = link();
    await userEvent.click(target);
    await nextFrame();
    const card = screen.getByTestId('graph-decision-a');
    act(() => {
      for (const observer of nearObservers) observer.leave(card);
    });
    expect(target).toBeInTheDocument();
    expect(document.activeElement).toBe(target);
  });

  it('expands the linked decision when it is folded', async () => {
    setup('income', ['a']);
    expect(screen.queryByTestId('body-income')).toBeNull();
    await userEvent.click(link());
    await nextFrame();
    expect(screen.getByTestId('body-income')).toBeInTheDocument();
    expect(screen.getByTestId('graph-toggle-income')).toHaveAttribute('aria-expanded', 'true');
  });

  it('focuses the linked decision heading when the link is pressed from the keyboard', async () => {
    setup('income', ['a']);
    act(() => link().focus());
    await userEvent.keyboard('{Enter}');
    await nextFrame();
    expect(document.activeElement).toBe(screen.getByTestId('graph-toggle-income'));
    expect(animate.mock.contexts).toContain(screen.getByTestId('graph-decision-income'));
  });

  it('opens a decision the graph does not draw through the host', async () => {
    const { onOpenDecision, onReveal } = setup('missing', ['a']);
    const target = link();
    await userEvent.click(target);
    await nextFrame();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(animate).not.toHaveBeenCalled();
    expect(onReveal).not.toHaveBeenCalled();
    expect(screen.getByTestId('graph-toggle-income')).toHaveAttribute('aria-expanded', 'false');
    expect(onOpenDecision).toHaveBeenCalledTimes(1);
    expect(onOpenDecision).toHaveBeenCalledWith('missing');
  });
});
