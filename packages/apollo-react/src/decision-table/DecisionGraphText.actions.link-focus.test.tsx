import { act, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { vi } from 'vitest';
import type { DecisionGraphAction } from './decisionGraphActionTypes';
import type { DecisionGraphNode } from './decisionGraphTypes';
import { DecisionGraphText } from './DecisionGraphText';
import { TokenChip } from './TokenChip';

type Action = DecisionGraphAction<string, string>;

const leaf = (id: string, label: string): DecisionGraphNode => ({
  kind: 'decision',
  id,
  label,
  logic: { kind: 'other' },
  children: [],
});

const focusedId = () =>
  document.activeElement?.getAttribute('data-testid') ?? document.activeElement?.tagName;

class NearObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly scrollMargin = '0px';
  readonly thresholds = [0];
  readonly #callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
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

beforeEach(() => {
  HTMLElement.prototype.scrollTo = () => {};
  vi.stubGlobal('IntersectionObserver', NearObserver);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const actions: readonly Action[] = [{ kind: 'rename', onRename: () => {} }];

const linkToX = (
  <TokenChip
    token={{ kind: 'input', columnId: 'c1', text: 'X', producedBy: 'x' }}
    mark={undefined}
    output={false}
    selected={false}
    stop={undefined}
    link={{ decisionId: 'x', label: 'Open X', tabbable: true }}
  />
);

const setup = () => {
  const handle = { fold: () => {}, dropLink: () => {} };
  const Host = () => {
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set(['a']));
    const [showLink, setShowLink] = useState(true);
    handle.fold = () => setExpanded(new Set());
    handle.dropLink = () => setShowLink(false);
    return (
      <DecisionGraphText
        citations={{ kind: 'none' }}
        nodes={[leaf('a', 'A'), leaf('m', 'M'), leaf('x', 'X')]}
        mode={{
          kind: 'edit',
          selected: null,
          onReveal: () => {},
          edit: { actions, wordRefusal: (refusal) => refusal },
        }}
        renderBody={(decisionId) =>
          decisionId === 'a' && showLink ? <div data-testid="body-a">{linkToX}</div> : null
        }
        expansion={{ expanded, onChange: setExpanded }}
        dataTestId="graph"
      />
    );
  };
  return { Host, handle };
};

describe('focus recovery from a decision link inside a body', () => {
  it('returns focus to the card whose body held it when the host folds that card', () => {
    const { Host, handle } = setup();
    render(<Host />);
    screen.getByTestId('body-a').querySelector<HTMLElement>('button')?.focus();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Open X');
    act(() => handle.fold());
    expect(focusedId()).toBe('graph-toggle-a');
  });

  it('returns focus to the card whose body held it when the body drops the focused link', () => {
    const { Host, handle } = setup();
    render(<Host />);
    screen.getByTestId('body-a').querySelector<HTMLElement>('button')?.focus();
    act(() => handle.dropLink());
    expect(focusedId()).toBe('graph-toggle-a');
  });
});
