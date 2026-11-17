import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useState } from 'react';
import { type Mock, onTestFinished, vi } from 'vitest';
import {
  DIFF_COLUMNS,
  DIFF_POLICY,
  DIFF_RULES,
  EVERY_STATE_DIFF,
} from './__fixtures__/diffSentences.fixtures';
import { installEscapeCloseRequest } from './__fixtures__/modalDialog';
import {
  HIT_POLICIES,
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_POLICY,
  manySentenceRules,
  COLUMN_TYPES,
  type FixtureType,
} from './__fixtures__/sentences.fixtures';
import { type FlatTextProps, textPropsOf } from './__fixtures__/textMode';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { DecisionText } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import type { TableMarks } from './marks';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceSelection } from './sentenceTypes';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const RULES = manySentenceRules(400);

const text = (props: Partial<FlatTextProps>) => (
  <DecisionText
    {...textPropsOf({
      rules: RULES,
      ...MULTI_SENTENCE_COLUMNS,
      hitPolicy: MULTI_SENTENCE_POLICY,
      ariaLabel: 'Rules',
      dataTestId: 'nl',
      onSelect: vi.fn(),
      ...props,
    })}
  />
);

type TextProps = Parameters<typeof text>[0];

const Scroller = ({ wrapped, ...props }: TextProps & { wrapped?: boolean }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const view = container && text({ ...props, scroll: { container } });
  return (
    <div data-testid="scroller" ref={setContainer} style={{ overflowY: 'auto', height: 600 }}>
      {wrapped ? (
        <div data-testid="wrapper" style={{ overflowY: 'auto' }}>
          {view}
        </div>
      ) : (
        <div>{view}</div>
      )}
    </div>
  );
};

const scroller = (props: TextProps & { wrapped?: boolean }) => <Scroller {...props} />;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DecisionText scroll', () => {
  it('is its own scroll frame with a sticky header by default', () => {
    render(
      <div style={{ overflowY: 'auto', height: 600 }}>
        <div>{text({})}</div>
      </div>
    );
    expect(screen.getByTestId('nl')).toHaveClass('overflow-auto');
    expect(screen.getByTestId('nl-header')).toHaveClass('sticky');
  });

  it('sizes to its rules with a header that scrolls away when the ancestor scrolls', () => {
    render(scroller({}));
    expect(screen.getByTestId('nl')).not.toHaveClass('overflow-auto');
    expect(screen.getByTestId('nl-header')).toHaveClass('static');
  });

  it('scrolls the ancestor, not itself, to a rule the host selects', () => {
    const { rerender } = render(scroller({}));
    const outer = screen.getByTestId('scroller');
    rerender(scroller({ selected: { kind: 'rule', rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(outer.scrollTop).toBe((offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
    expect(screen.getByTestId('nl').scrollTop).toBe(0);
  });

  it('scrolls the named container past a content-sized wrapper that only says it scrolls', () => {
    const { rerender } = render(scroller({ wrapped: true }));
    rerender(scroller({ wrapped: true, selected: { kind: 'rule', rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(screen.getByTestId('scroller').scrollTop).toBe(
      (offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX
    );
    expect(screen.getByTestId('wrapper').scrollTop).toBe(0);
  });

  it('keeps the selected rule mounted far from the window', () => {
    render(scroller({ selected: { kind: 'rule', rowId: 'row-350' } }));
    expect(screen.getByTestId('nl-row-row-350')).toBeInTheDocument();
    expect(screen.queryByTestId('nl-row-row-200')).toBeNull();
  });

  it('windows its rules against the ancestor as it scrolls', () => {
    render(scroller({}));
    const outer = screen.getByTestId('scroller');
    const list = screen.getByTestId('nl-row-row-0').parentElement;
    if (!list) throw new Error('no rule list');
    vi.spyOn(list, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -outer.scrollTop, 100, 100)
    );
    act(() => {
      outer.scrollTop = sentenceRuleOffsets(RULES)[300] ?? 0;
      fireEvent.scroll(outer);
    });
    expect(screen.queryByTestId('nl-row-row-0')).toBeNull();
    expect(screen.getByTestId('nl-row-row-300')).toBeInTheDocument();
  });

  it('scrolls the document to a rule the host selects when nothing else scrolls', () => {
    const { rerender } = render(text({ scroll: {} }));
    const page = document.documentElement;
    rerender(text({ scroll: {}, selected: { kind: 'rule', rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(page.scrollTop).toBe((offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
    expect(screen.getByTestId('nl').scrollTop).toBe(0);
    page.scrollTop = 0;
  });

  it('windows its rules against the document as it scrolls', () => {
    render(text({ scroll: {} }));
    const page = document.documentElement;
    const list = screen.getByTestId('nl-row-row-0').parentElement;
    if (!list) throw new Error('no rule list');
    vi.spyOn(list, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -page.scrollTop, 100, 100)
    );
    act(() => {
      page.scrollTop = sentenceRuleOffsets(RULES)[300] ?? 0;
      fireEvent.scroll(document);
    });
    expect(screen.queryByTestId('nl-row-row-0')).toBeNull();
    expect(screen.getByTestId('nl-row-row-300')).toBeInTheDocument();
    page.scrollTop = 0;
  });

  it('windows its rules against the window height when only the height changes', () => {
    const observers: { callback: ResizeObserverCallback; observer: ResizeObserver }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          observers.push({ callback, observer: this });
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
    const page = document.documentElement;
    const height = vi.spyOn(page, 'clientHeight', 'get').mockReturnValue(400);
    const added = vi.spyOn(window, 'addEventListener');
    const removed = vi.spyOn(window, 'removeEventListener');
    const resizeListeners = (spy: typeof added) =>
      spy.mock.calls.filter(([type]) => type === 'resize').map(([, listener]) => listener);
    const { unmount } = render(text({ scroll: {} }));
    act(() => {
      for (const { callback, observer } of observers) callback([], observer);
    });
    const mounted = () => screen.getAllByTestId(/^nl-row-row-\d+$/).length;
    const short = mounted();
    height.mockReturnValue(4000);
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(mounted()).toBeGreaterThan(short);
    expect(resizeListeners(added)).not.toHaveLength(0);
    unmount();
    expect(resizeListeners(removed)).toEqual(resizeListeners(added));
    vi.unstubAllGlobals();
  });

  it('forwards each document scroll to the page once however many views window against it', () => {
    render(
      <StrictMode>
        {text({ scroll: {}, dataTestId: 'first' })}
        {text({ scroll: {}, dataTestId: 'second' })}
      </StrictMode>
    );
    const forwarded = vi.fn();
    document.documentElement.addEventListener('scroll', forwarded);
    act(() => {
      fireEvent.scroll(document);
    });
    document.documentElement.removeEventListener('scroll', forwarded);
    expect(forwarded).toHaveBeenCalledTimes(1);
  });

  it('keeps forwarding while a view remains and stops once none do', () => {
    const { rerender, unmount } = render(
      <>
        {text({ scroll: {}, dataTestId: 'first' })}
        {text({ scroll: {}, dataTestId: 'second' })}
      </>
    );
    const forwarded = vi.fn();
    document.documentElement.addEventListener('scroll', forwarded);
    rerender(<>{text({ scroll: {}, dataTestId: 'first' })}</>);
    fireEvent.scroll(document);
    expect(forwarded).toHaveBeenCalledTimes(1);
    rerender(<>{text({ scroll: 'self', dataTestId: 'first' })}</>);
    fireEvent.scroll(document);
    expect(forwarded).toHaveBeenCalledTimes(1);
    unmount();
    document.documentElement.removeEventListener('scroll', forwarded);
  });

  describe('reveal', () => {
    const native = vi.fn();
    beforeEach(() => {
      native.mockClear();
      Object.defineProperty(Element.prototype, 'scrollIntoView', {
        value: native,
        configurable: true,
        writable: true,
      });
    });
    afterEach(() => {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    });
    const NEAREST = { block: 'nearest', inline: 'nearest' };

    it.each([
      ['a bordered container', { border: '4px solid' }],
      ['a percentage scroll-padding-top', { scrollPaddingTop: '10%' }],
      ['a calc() scroll-padding-top', { scrollPaddingTop: 'calc(10% + 24px)' }],
    ])('leaves revealing a rule the host selects to the platform in %s', (_, style) => {
      const { rerender } = render(scroller({}));
      Object.assign(screen.getByTestId('scroller').style, style);
      rerender(scroller({ selected: { kind: 'rule', rowId: 'row-10' } }));
      const card = screen.getByTestId('nl-row-row-10');
      expect(
        native.mock.contexts.some((target) => target instanceof Node && card.contains(target))
      ).toBe(true);
      expect(native).toHaveBeenLastCalledWith(NEAREST);
    });

    it('reveals a rule the host selects far from the window once it mounts', () => {
      const { rerender } = render(scroller({}));
      rerender(scroller({ selected: { kind: 'rule', rowId: 'row-300' } }));
      expect(native.mock.contexts).toContain(screen.getByTestId('nl-row-row-300'));
    });

    it('reveals only the stop, not its rule, in a rule taller than the container', () => {
      const { rerender } = render(scroller({}));
      vi.spyOn(screen.getByTestId('scroller'), 'clientHeight', 'get').mockReturnValue(10);
      rerender(scroller({ selected: { kind: 'cell', rowId: 'row-1', columnId: 'country' } }));
      const card = screen.getByTestId('nl-row-row-1');
      expect(native.mock.contexts).not.toContain(card);
      expect(native.mock.contexts.length).toBeGreaterThan(0);
      expect(
        native.mock.contexts.every((target) => target instanceof Node && card.contains(target))
      ).toBe(true);
    });
  });

  it('hides a mark tooltip when the ancestor scrolls', () => {
    render(scroller({ headerMark: { tone: 'error', title: 'Bad', glyph: true } }));
    const badge = screen.getByTestId('nl-header').querySelector('[data-mark-title]');
    if (!badge) throw new Error('header badge');
    fireEvent.pointerOver(badge);
    expect(screen.getByTestId('nl-mark-tooltip')).toHaveTextContent('Bad');
    act(() => {
      fireEvent.scroll(screen.getByTestId('scroller'));
    });
    expect(screen.queryByTestId('nl-mark-tooltip')).toBeNull();
  });

  it('windows again when its list moves inside the ancestor', () => {
    render(scroller({}));
    const outer = screen.getByTestId('scroller');
    const dispatched = vi.fn();
    outer.addEventListener('scroll', dispatched);
    const list = screen.getByTestId('nl-row-row-0').parentElement;
    if (!list) throw new Error('no rule list');
    vi.spyOn(list, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 500, 100, 100));
    act(() => {
      fireEvent.scroll(outer);
    });
    expect(dispatched).toHaveBeenCalledTimes(2);
  });

  it('mounts the rules exposed when slotted content above it shrinks, whatever its light-DOM order', () => {
    const resizes: { callback: () => void; targets: Set<Element> }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        targets = new Set<Element>();
        constructor(callback: ResizeObserverCallback) {
          resizes.push({ callback: () => callback([], this), targets: this.targets });
        }
        observe(target: Element) {
          this.targets.add(target);
        }
        unobserve(target: Element) {
          this.targets.delete(target);
        }
        disconnect() {
          this.targets.clear();
        }
      }
    );
    const crossings: { callback: () => void }[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        targets = new Set<Element>();
        constructor(callback: IntersectionObserverCallback) {
          const rect = new DOMRect();
          crossings.push({
            callback: () =>
              callback(
                [...this.targets].map((target) => ({
                  target,
                  isIntersecting: true,
                  intersectionRatio: 1,
                  boundingClientRect: rect,
                  intersectionRect: rect,
                  rootBounds: rect,
                  time: 0,
                })),
                this
              ),
          });
        }
        readonly root = null;
        readonly rootMargin = '0px';
        readonly scrollMargin = '0px';
        readonly thresholds = [0];
        observe(target: Element) {
          this.targets.add(target);
        }
        unobserve(target: Element) {
          this.targets.delete(target);
        }
        disconnect() {
          this.targets.clear();
        }
        takeRecords() {
          return [];
        }
      }
    );
    const host = document.body.appendChild(document.createElement('div'));
    onTestFinished(() => host.remove());
    const frame = document.createElement('div');
    frame.style.overflowY = 'auto';
    frame.style.height = '600px';
    const slot = (name: string) => Object.assign(document.createElement('slot'), { name });
    frame.append(slot('header'), slot('body'));
    host.attachShadow({ mode: 'open' }).append(frame);
    const body = host.appendChild(Object.assign(document.createElement('div'), { slot: 'body' }));
    const header = host.appendChild(
      Object.assign(document.createElement('div'), { slot: 'header' })
    );
    let listTop = 0;
    const { getBoundingClientRect } = HTMLUListElement.prototype;
    vi.spyOn(HTMLUListElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLUListElement
    ) {
      return this.closest('[data-testid="nl"]')
        ? new DOMRect(0, listTop, 100, 100)
        : getBoundingClientRect.call(this);
    });
    frame.scrollTop = 5000;
    render(text({ scroll: { container: frame } }), { container: body });
    act(() => {
      for (const { callback } of resizes) callback();
    });
    const exposed = sentenceRuleOffsets(RULES).findIndex((offset) => offset > 4000);
    expect(screen.getByTestId('nl-row-row-0')).toBeInTheDocument();
    expect(screen.queryByTestId(`nl-row-row-${exposed}`)).toBeNull();
    listTop = -4000;
    act(() => {
      for (const { callback, targets } of resizes) if (targets.has(header)) callback();
      for (const { callback } of crossings) callback();
    });
    expect(screen.getByTestId(`nl-row-row-${exposed}`)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('DecisionText unmount', () => {
  const OPEN = { rowId: 'row-1', columnId: 'country', index: 0 };
  const flush = () => act(() => Promise.resolve());

  const Host = ({
    onCancel,
    unmountOnCommit = false,
  }: {
    onCancel: () => void;
    unmountOnCommit?: boolean;
  }) => {
    const [shown, setShown] = useState(true);
    const [rules, setRules] = useState(RULES);
    const [editing, setEditing] = useState<DecisionTextEdit<FixtureType>['editing']>(OPEN);
    if (!shown) return null;
    return (
      <>
        <button
          type="button"
          data-testid="drop"
          onClick={() => setRules(RULES.filter(({ rowId }) => rowId !== OPEN.rowId))}
        />
        {text({
          rules,
          edit: {
            editing,
            onStartEdit: setEditing,
            onCancel: () => {
              onCancel();
              setShown(false);
            },
            onCommit: () => {
              if (unmountOnCommit) setShown(false);
              else setEditing(null);
            },
            onClearCell: vi.fn(),
            onDeleteRule: vi.fn(),
          },
        })}
      </>
    );
  };

  it('leaves the editor it unmounts with to the host', async () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      text({
        edit: {
          editing: OPEN,
          onCommit: vi.fn(),
          onCancel,
          onClearCell: vi.fn(),
          onDeleteRule: vi.fn(),
        },
      })
    );
    unmount();
    await flush();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels nothing when strict mode mounts it and it unmounts at once', async () => {
    const onCancel = vi.fn();
    const { unmount } = render(
      <StrictMode>
        {text({
          edit: {
            editing: OPEN,
            onCommit: vi.fn(),
            onCancel,
            onClearCell: vi.fn(),
            onDeleteRule: vi.fn(),
          },
        })}
      </StrictMode>
    );
    unmount();
    await flush();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels once when the host unmounts it from onCancel', async () => {
    const uninstall = installEscapeCloseRequest();
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId('nl-editor'), { key: 'Escape' });
    await flush();
    uninstall();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels nothing when the host unmounts it from an accepted commit', async () => {
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} unmountOnCommit />);
    fireEvent.change(screen.getByTestId('nl-editor'), { target: { value: 'NL' } });
    fireEvent.keyDown(screen.getByTestId('nl-editor'), { key: 'Enter' });
    await flush();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels once when the host unmounts it from clearing the edited cell', async () => {
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^Remove country from rule 2/i }));
    await flush();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels once when the edited rule goes and the host unmounts it from onCancel', async () => {
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('drop'));
    await flush();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

const MARK_TITLES = {
  header: 'Header mark',
  rule: 'Rule mark',
  value: 'Value mark',
  band: 'Band mark',
} as const;

const MARKS: TableMarks = {
  rows: new Map([
    ['row-2', { tone: 'error', glyph: true, title: MARK_TITLES.rule }],
    ['row-3', { cells: { score: { tone: 'warning', glyph: true, title: MARK_TITLES.value } } }],
  ]),
  columns: new Map([['score', { tone: 'warning', glyph: true, title: MARK_TITLES.band }]]),
};

const SelectingScroller = ({ editing }: { editing: boolean }) => {
  const [selected, setSelected] = useState<SentenceSelection | null>(null);
  return scroller({
    selected,
    onSelect: setSelected,
    marks: MARKS,
    headerMark: { tone: 'error', glyph: true, title: MARK_TITLES.header },
    edit: editing
      ? { onCommit: () => undefined, onClearCell: () => {}, onDeleteRule: () => {} }
      : undefined,
  });
};

describe('DecisionText mark clicks', () => {
  let scrollIntoViewSpy: Mock<Element['scrollIntoView']>;
  beforeEach(() => {
    scrollIntoViewSpy = vi.fn<Element['scrollIntoView']>();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;
  });

  const marked = (title: string): HTMLElement => {
    const element = [...document.querySelectorAll<HTMLElement>('[data-mark-title]')].find(
      (candidate) => candidate.dataset.markTitle === title
    );
    if (!element) throw new Error(`No mark titled ${title}`);
    return element;
  };

  const scrolledBy = () => {
    const outer = screen.getByTestId('scroller');
    outer.scrollTop = 40;
    return () => ({
      scrollTop: outer.scrollTop,
      scrollIntoView: scrollIntoViewSpy.mock.calls.length,
    });
  };

  it.each([
    ['select', false],
    ['edit', true],
  ] as const)('never scrolls when a mark is clicked in %s mode', async (_mode, editing) => {
    render(<SelectingScroller editing={editing} />);
    for (const title of Object.values(MARK_TITLES)) {
      const scrollNow = scrolledBy();
      await userEvent.click(marked(title));
      expect({ title, ...scrollNow() }).toEqual({ title, scrollTop: 40, scrollIntoView: 0 });
      await userEvent.keyboard('{Escape}');
    }
  });

  it('never scrolls when a mark is tapped', async () => {
    render(<SelectingScroller editing />);
    const user = userEvent.setup();
    for (const title of Object.values(MARK_TITLES)) {
      const scrollNow = scrolledBy();
      await user.pointer({ keys: '[TouchA]', target: marked(title) });
      expect({ title, ...scrollNow() }).toEqual({ title, scrollTop: 40, scrollIntoView: 0 });
      await user.keyboard('{Escape}');
    }
  });

  it('still scrolls a rule the keyboard moves to after a mark is clicked', async () => {
    render(<SelectingScroller editing={false} />);
    await userEvent.click(marked(MARK_TITLES.rule));
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowDown}');
    expect(scrollIntoViewSpy).toHaveBeenCalled();
  });

  it('never scrolls when a changed value or rule of a diff is clicked', async () => {
    render(
      <div data-testid="scroller" style={{ overflowY: 'auto', height: 600 }}>
        <DecisionText
          table={{ rules: DIFF_RULES, ...DIFF_COLUMNS, hitPolicy: DIFF_POLICY }}
          hitPolicies={HIT_POLICIES}
          columnTypes={COLUMN_TYPES}
          ariaLabel="Rules"
          dataTestId="nl"
          mode={{ kind: 'diff', diff: { ...EVERY_STATE_DIFF, mode: 'full' } }}
        />
      </div>
    );
    const changed = [...document.querySelectorAll<HTMLElement>('[data-change]')];
    expect(changed.length).toBeGreaterThan(2);
    for (const element of changed) {
      const scrollNow = scrolledBy();
      await userEvent.click(element);
      expect(scrollNow()).toEqual({ scrollTop: 40, scrollIntoView: 0 });
    }
  });
});
