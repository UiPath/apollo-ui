import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { vi } from 'vitest';
import { installEscapeCloseRequest } from './__fixtures__/modalDialog';
import {
  MULTI_SENTENCE_COLUMNS,
  MULTI_SENTENCE_HEADER,
  manySentenceRules,
} from './__fixtures__/sentences.fixtures';
import { FALLBACK_ROW_VIEWPORT_PX } from './constants';
import { DecisionText, type DecisionTextProps } from './DecisionText';
import type { DecisionTextEdit } from './decisionTextTypes';
import { sentenceRuleOffsets } from './sentenceRuleHeights';
import type { SentenceSelection } from './sentenceTypes';
import { scrollAncestorOf } from './useRuleWindow';

vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const RULES = manySentenceRules(400);

const text = (
  props: Partial<Extract<DecisionTextProps, { selected: SentenceSelection | null }>>
) => (
  <DecisionText
    rules={RULES}
    {...MULTI_SENTENCE_COLUMNS}
    header={MULTI_SENTENCE_HEADER}
    ariaLabel="Rules"
    dataTestId="nl"
    selected={props.selected ?? null}
    onSelect={vi.fn()}
    {...props}
  />
);

const scroller = (children: React.ReactNode) => (
  <div data-testid="scroller" style={{ overflowY: 'auto', height: 600 }}>
    <div>{children}</div>
  </div>
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('scrollAncestorOf', () => {
  it('finds the nearest ancestor that scrolls, skipping those that do not', () => {
    render(scroller(<section data-testid="inner" />));
    const found = scrollAncestorOf(screen.getByTestId('inner'));
    expect(found?.scroller).toBe(screen.getByTestId('scroller'));
    expect(found?.path).toHaveLength(1);
  });

  it('is the page when nothing above scrolls', () => {
    render(<section data-testid="inner" />);
    expect(scrollAncestorOf(screen.getByTestId('inner'))?.scroller).toBe(document.documentElement);
  });

  it('is the page past a body whose overflow scrolls the viewport', () => {
    document.documentElement.style.overflowY = 'visible';
    document.body.style.overflowY = 'auto';
    render(<section data-testid="inner" />);
    const found = scrollAncestorOf(screen.getByTestId('inner'));
    document.body.style.overflowY = '';
    document.documentElement.style.overflowY = '';
    expect(found?.scroller).toBe(document.documentElement);
  });

  it('steps out of a shadow root through its host', () => {
    render(scroller(<div data-testid="host" />));
    const root = screen.getByTestId('host').attachShadow({ mode: 'open' });
    const inner = document.createElement('section');
    root.append(inner);
    expect(scrollAncestorOf(inner)?.scroller).toBe(screen.getByTestId('scroller'));
  });

  it('follows a slotted element to the scroller around its slot', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const frame = document.createElement('div');
    frame.style.overflowY = 'scroll';
    frame.append(document.createElement('slot'));
    root.append(frame);
    const slotted = document.createElement('section');
    host.append(slotted);
    Object.defineProperty(slotted, 'assignedSlot', { value: frame.querySelector('slot') });
    expect(scrollAncestorOf(slotted)?.scroller).toBe(frame);
    host.remove();
  });
});

describe('DecisionText scroll', () => {
  it('is its own scroll frame with a sticky header by default', () => {
    render(scroller(text({})));
    expect(screen.getByTestId('nl')).toHaveClass('overflow-auto');
    expect(screen.getByTestId('nl-header')).toHaveClass('sticky');
  });

  it('sizes to its rules with a header that scrolls away when the ancestor scrolls', () => {
    render(scroller(text({ scroll: 'ancestor' })));
    expect(screen.getByTestId('nl')).not.toHaveClass('overflow-auto');
    expect(screen.getByTestId('nl-header')).toHaveClass('static');
  });

  it('scrolls the ancestor, not itself, to a rule the host selects', () => {
    const { rerender } = render(scroller(text({ scroll: 'ancestor' })));
    const outer = screen.getByTestId('scroller');
    rerender(scroller(text({ scroll: 'ancestor', selected: { rowId: 'row-300' } })));
    const offsets = sentenceRuleOffsets(RULES);
    expect(outer.scrollTop).toBe((offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
    expect(screen.getByTestId('nl').scrollTop).toBe(0);
  });

  it('keeps the selected rule mounted far from the window', () => {
    render(scroller(text({ scroll: 'ancestor', selected: { rowId: 'row-350' } })));
    expect(screen.getByTestId('nl-row-row-350')).toBeInTheDocument();
    expect(screen.queryByTestId('nl-row-row-200')).toBeNull();
  });

  it('windows its rules against the ancestor as it scrolls', () => {
    render(scroller(text({ scroll: 'ancestor' })));
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
    const { rerender } = render(text({ scroll: 'ancestor' }));
    const page = document.documentElement;
    rerender(text({ scroll: 'ancestor', selected: { rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(page.scrollTop).toBe((offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
    expect(screen.getByTestId('nl').scrollTop).toBe(0);
    page.scrollTop = 0;
  });

  it('windows its rules against the document as it scrolls', () => {
    render(text({ scroll: 'ancestor' }));
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
    const { unmount } = render(text({ scroll: 'ancestor' }));
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
        {text({ scroll: 'ancestor', dataTestId: 'first' })}
        {text({ scroll: 'ancestor', dataTestId: 'second' })}
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
        {text({ scroll: 'ancestor', dataTestId: 'first' })}
        {text({ scroll: 'ancestor', dataTestId: 'second' })}
      </>
    );
    const forwarded = vi.fn();
    document.documentElement.addEventListener('scroll', forwarded);
    rerender(<>{text({ scroll: 'ancestor', dataTestId: 'first' })}</>);
    fireEvent.scroll(document);
    expect(forwarded).toHaveBeenCalledTimes(1);
    rerender(<>{text({ scroll: 'self', dataTestId: 'first' })}</>);
    fireEvent.scroll(document);
    expect(forwarded).toHaveBeenCalledTimes(1);
    unmount();
    document.documentElement.removeEventListener('scroll', forwarded);
  });

  it('resolves a percentage scroll-padding-top against the ancestor', () => {
    const { rerender } = render(scroller(text({ scroll: 'ancestor' })));
    const outer = screen.getByTestId('scroller');
    outer.style.scrollPaddingTop = '10%';
    vi.spyOn(outer, 'clientHeight', 'get').mockReturnValue(600);
    const list = screen.getByTestId('nl-row-row-0').parentElement;
    if (!list) throw new Error('no rule list');
    vi.spyOn(list, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -outer.scrollTop, 100, 100)
    );
    outer.scrollTop = 100000;
    rerender(scroller(text({ scroll: 'ancestor', selected: { rowId: 'row-10' } })));
    expect(outer.scrollTop).toBe((sentenceRuleOffsets(RULES)[10] ?? 0) - 60);
  });

  it('hides a mark tooltip when the ancestor scrolls', () => {
    render(
      scroller(
        text({ scroll: 'ancestor', headerMark: { tone: 'error', title: 'Bad', glyph: true } })
      )
    );
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
    render(scroller(text({ scroll: 'ancestor' })));
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
});

describe('DecisionText unmount', () => {
  const edit = (onCancel: () => void, open: boolean): DecisionTextEdit => ({
    editing: open ? { rowId: 'row-1', columnId: 'country', index: 0 } : null,
    onCommit: vi.fn(),
    onCancel,
    onClearCell: vi.fn(),
    onDeleteRule: vi.fn(),
  });
  const flush = () => act(() => Promise.resolve());

  it('cancels the editor it leaves open', async () => {
    const onCancel = vi.fn();
    const { unmount } = render(text({ edit: edit(onCancel, true) }));
    onCancel.mockClear();
    unmount();
    await flush();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels nothing when no editor is open', async () => {
    const onCancel = vi.fn();
    const { unmount } = render(text({ edit: edit(onCancel, false) }));
    unmount();
    await flush();
    expect(onCancel).not.toHaveBeenCalled();
  });

  const Host = ({
    onCancel,
    unmountOnCommit,
  }: {
    onCancel: () => void;
    unmountOnCommit: boolean;
  }) => {
    const [shown, setShown] = useState(true);
    const [editing, setEditing] = useState<DecisionTextEdit['editing']>({
      rowId: 'row-1',
      columnId: 'country',
      index: 0,
    });
    if (!shown) return null;
    return text({
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
    });
  };

  it('cancels once when the host unmounts it from onCancel', async () => {
    const uninstall = installEscapeCloseRequest();
    const onCancel = vi.fn();
    render(<Host onCancel={onCancel} unmountOnCommit={false} />);
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

  it('keeps the editor when strict mode remounts it', async () => {
    const onCancel = vi.fn();
    render(<StrictMode>{text({ edit: edit(onCancel, true) })}</StrictMode>);
    await flush();
    expect(onCancel).not.toHaveBeenCalled();
  });

  const OPEN = { rowId: 'row-1', columnId: 'country', index: 0 };

  const Reopening = ({
    onCancel,
    hideOnCancel = false,
  }: {
    onCancel: () => void;
    hideOnCancel?: boolean;
  }) => {
    const [shown, setShown] = useState(true);
    const [rules, setRules] = useState(RULES);
    const [editing, setEditing] = useState<DecisionTextEdit['editing']>(OPEN);
    if (!shown) return null;
    return (
      <>
        <button type="button" data-testid="reopen" onClick={() => setEditing(OPEN)} />
        <button type="button" data-testid="hide" onClick={() => setShown(false)} />
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
              if (hideOnCancel) setShown(false);
              else setEditing(null);
            },
            onCommit: () => setEditing(null),
            onClearCell: () => setShown(false),
            onDeleteRule: vi.fn(),
          },
        })}
      </>
    );
  };

  it('cancels a value the host reopens after a cancel', async () => {
    const uninstall = installEscapeCloseRequest();
    const onCancel = vi.fn();
    render(<Reopening onCancel={onCancel} />);
    fireEvent.keyDown(screen.getByTestId('nl-editor'), { key: 'Escape' });
    await flush();
    uninstall();
    expect(screen.queryByTestId('nl-editor')).toBeNull();
    fireEvent.click(screen.getByTestId('reopen'));
    expect(screen.getByTestId('nl-editor')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('hide'));
    await flush();
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('cancels a value the host reopens after an accepted commit', async () => {
    const onCancel = vi.fn();
    render(<Reopening onCancel={onCancel} />);
    fireEvent.change(screen.getByTestId('nl-editor'), { target: { value: 'NL' } });
    fireEvent.keyDown(screen.getByTestId('nl-editor'), { key: 'Enter' });
    await flush();
    fireEvent.click(screen.getByTestId('reopen'));
    fireEvent.click(screen.getByTestId('hide'));
    await flush();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels once when the host unmounts it from clearing the edited cell', async () => {
    const onCancel = vi.fn();
    render(<Reopening onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /^Remove country from rule 2/i }));
    await flush();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels once when the edited rule goes and the host unmounts it from onCancel', async () => {
    const onCancel = vi.fn();
    render(<Reopening onCancel={onCancel} hideOnCancel />);
    fireEvent.click(screen.getByTestId('drop'));
    await flush();
    expect(screen.queryByTestId('nl')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
