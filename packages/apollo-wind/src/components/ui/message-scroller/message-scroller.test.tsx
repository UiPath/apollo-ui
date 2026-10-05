import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MESSAGE_SCROLLER_BUTTON_STRINGS,
  DEFAULT_MESSAGE_SCROLLER_VIEWPORT_STRINGS,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from './message-scroller';

function Conversation({
  button = <MessageScrollerButton />,
  children,
}: {
  button?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <MessageScrollerProvider autoScroll defaultScrollPosition="end">
      <MessageScroller data-testid="root">
        <MessageScrollerViewport data-testid="viewport" aria-label="Conversation">
          <MessageScrollerContent data-testid="content">
            <MessageScrollerItem messageId="m1" data-testid="m1">
              First
            </MessageScrollerItem>
            <MessageScrollerItem messageId="m2" scrollAnchor data-testid="m2">
              Second
            </MessageScrollerItem>
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        {button}
      </MessageScroller>
    </MessageScrollerProvider>
  );
}

describe('MessageScroller', () => {
  it('renders the parts with data-slot attributes and the items in order', () => {
    render(<Conversation />);
    expect(screen.getByTestId('root')).toHaveAttribute('data-slot', 'message-scroller');
    expect(screen.getByTestId('viewport')).toHaveAttribute(
      'data-slot',
      'message-scroller-viewport'
    );
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'message-scroller-content');
    expect(screen.getByTestId('m1')).toHaveAttribute('data-slot', 'message-scroller-item');
    expect(screen.getByTestId('m2').compareDocumentPosition(screen.getByTestId('m1'))).toBe(
      Node.DOCUMENT_POSITION_PRECEDING
    );
  });

  it('leaves the frame height to the consumer', () => {
    render(<Conversation />);
    const root = screen.getByTestId('root');
    expect(root).toHaveClass('flex', 'flex-col', 'min-h-0');
    expect(root).not.toHaveClass('flex-1');
  });

  it('exposes the viewport as a labelled region and the content as a log', () => {
    render(<Conversation />);
    expect(screen.getByRole('region', { name: 'Conversation' })).toBe(
      screen.getByTestId('viewport')
    );
    expect(screen.getByRole('log')).toBe(screen.getByTestId('content'));
    expect(screen.getByTestId('content')).toHaveAttribute('aria-relevant', 'additions');
  });

  it('names the viewport from strings, letting an explicit aria-label win', () => {
    const { rerender } = render(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport data-testid="viewport" />
        </MessageScroller>
      </MessageScrollerProvider>
    );
    expect(
      screen.getByRole('region', { name: DEFAULT_MESSAGE_SCROLLER_VIEWPORT_STRINGS.label })
    ).toBe(screen.getByTestId('viewport'));
    rerender(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport data-testid="viewport" strings={{ label: 'Transcript' }} />
        </MessageScroller>
      </MessageScrollerProvider>
    );
    expect(screen.getByRole('region', { name: 'Transcript' })).toBe(screen.getByTestId('viewport'));
    rerender(
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport
            data-testid="viewport"
            strings={{ label: 'Transcript' }}
            aria-label="Conversation"
          />
        </MessageScroller>
      </MessageScrollerProvider>
    );
    expect(screen.getByRole('region', { name: 'Conversation' })).toBe(
      screen.getByTestId('viewport')
    );
  });

  it('renders the jump button with the default label', () => {
    render(<Conversation />);
    const button = screen.getByRole('button', {
      name: DEFAULT_MESSAGE_SCROLLER_BUTTON_STRINGS.scrollToLatest,
    });
    expect(button).toHaveAttribute('data-slot', 'message-scroller-button');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('takes the label from strings, and the start label for direction="start"', () => {
    const { rerender } = render(
      <Conversation button={<MessageScrollerButton strings={{ scrollToLatest: 'Neueste' }} />} />
    );
    expect(screen.getByRole('button', { name: 'Neueste' })).toBeInTheDocument();
    rerender(<Conversation button={<MessageScrollerButton direction="start" />} />);
    expect(
      screen.getByRole('button', { name: DEFAULT_MESSAGE_SCROLLER_BUTTON_STRINGS.scrollToStart })
    ).toHaveClass('top-3');
  });

  it('lets children replace the button content', () => {
    render(<Conversation button={<MessageScrollerButton>Jump</MessageScrollerButton>} />);
    expect(screen.getByRole('button', { name: 'Jump' })).toBeInTheDocument();
  });

  it('forwards refs on root, viewport, content and item', () => {
    const root = createRef<HTMLDivElement>();
    const viewport = createRef<HTMLDivElement>();
    const content = createRef<HTMLDivElement>();
    const item = createRef<HTMLDivElement>();
    render(
      <MessageScrollerProvider>
        <MessageScroller ref={root}>
          <MessageScrollerViewport ref={viewport}>
            <MessageScrollerContent ref={content}>
              <MessageScrollerItem ref={item} messageId="m1">
                x
              </MessageScrollerItem>
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    );
    expect(root.current).toHaveAttribute('data-slot', 'message-scroller');
    expect(viewport.current).toHaveAttribute('data-slot', 'message-scroller-viewport');
    expect(content.current).toHaveAttribute('data-slot', 'message-scroller-content');
    expect(item.current).toHaveAttribute('data-slot', 'message-scroller-item');
  });

  it('keeps the ref on a render element passed to the button', () => {
    const buttonRef = createRef<HTMLButtonElement>();
    render(
      <Conversation
        button={<MessageScrollerButton render={<button type="button" ref={buttonRef} />} />}
      />
    );
    expect(buttonRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(buttonRef.current).toHaveAttribute('data-slot', 'message-scroller-button');
  });

  it('exposes the scroll and visibility hooks inside the provider', () => {
    function Probe() {
      const scroller = useMessageScroller();
      const scrollable = useMessageScrollerScrollable();
      const visibility = useMessageScrollerVisibility();
      return (
        <output data-testid="probe">
          {[
            typeof scroller.scrollToEnd,
            typeof scroller.scrollToMessage,
            typeof scroller.scrollToStart,
            typeof scrollable.start,
            Array.isArray(visibility.visibleMessageIds),
          ].join(',')}
        </output>
      );
    }
    render(
      <Conversation>
        <Probe />
      </Conversation>
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(
      'function,function,function,boolean,true'
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Conversation />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
