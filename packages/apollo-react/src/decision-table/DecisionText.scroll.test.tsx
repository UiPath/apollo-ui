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
    rerender(scroller({ selected: { rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(outer.scrollTop).toBe((offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX);
    expect(screen.getByTestId('nl').scrollTop).toBe(0);
  });

  it('scrolls the named container past a content-sized wrapper that only says it scrolls', () => {
    const { rerender } = render(scroller({ wrapped: true }));
    rerender(scroller({ wrapped: true, selected: { rowId: 'row-300' } }));
    const offsets = sentenceRuleOffsets(RULES);
    expect(screen.getByTestId('scroller').scrollTop).toBe(
      (offsets[301] ?? 0) - FALLBACK_ROW_VIEWPORT_PX
    );
    expect(screen.getByTestId('wrapper').scrollTop).toBe(0);
  });

  it('keeps the selected rule mounted far from the window', () => {
    render(scroller({ selected: { rowId: 'row-350' } }));
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
    rerender(text({ scroll: {}, selected: { rowId: 'row-300' } }));
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

  it('resolves a percentage scroll-padding-top against the ancestor', () => {
    const { rerender } = render(scroller({}));
    const outer = screen.getByTestId('scroller');
    outer.style.scrollPaddingTop = '10%';
    vi.spyOn(outer, 'clientHeight', 'get').mockReturnValue(600);
    const list = screen.getByTestId('nl-row-row-0').parentElement;
    if (!list) throw new Error('no rule list');
    vi.spyOn(list, 'getBoundingClientRect').mockImplementation(
      () => new DOMRect(0, -outer.scrollTop, 100, 100)
    );
    outer.scrollTop = 100000;
    rerender(scroller({ selected: { rowId: 'row-10' } }));
    expect(outer.scrollTop).toBe((sentenceRuleOffsets(RULES)[10] ?? 0) - 60);
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
    const [editing, setEditing] = useState<DecisionTextEdit['editing']>(OPEN);
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
