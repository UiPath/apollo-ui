import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { buildTailwind } from '../../../tests/tailwind-compile';
import { Bubble, BubbleContent } from './bubble';
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from './message';
import { MessageActions } from './message-actions';

describe('Message', () => {
  it('keeps the avatar level with the bubble under the compact gaps', async () => {
    const { container } = render(
      <div data-density="compact">
        <Message>
          <MessageAvatar>AI</MessageAvatar>
          <MessageContent>
            <Bubble>
              <BubbleContent>Hi</BubbleContent>
            </Bubble>
            <MessageFooter>Now</MessageFooter>
          </MessageContent>
        </Message>
      </div>
    );
    const avatar = container.querySelector('[data-slot="message-avatar"]') as HTMLElement;
    const footer =
      'in-data-[density=compact]:group-has-[[data-slot=message-footer]]/message:-translate-y-6.75';
    const actions =
      'in-data-[density=compact]:group-has-[[data-slot=message-actions]]/message:-translate-y-8.75';
    const both =
      'in-data-[density=compact]:group-has-[[data-slot=message-footer]]/message:group-has-[[data-slot=message-actions]]/message:-translate-y-13.5';
    expect(avatar).toHaveClass(footer, actions, both);
    // The rule for both comes after the single ones and the comfortable rules, so it wins.
    const css = await buildTailwind(Array.from(avatar.classList));
    const at = (cls: string) => css.indexOf(`.${CSS.escape(cls)}`);
    expect(at(both)).toBeGreaterThan(at(footer));
    expect(at(both)).toBeGreaterThan(at(actions));
    expect(at(footer)).toBeGreaterThan(
      at(
        'group-has-[[data-slot=message-footer]]/message:group-has-[[data-slot=message-actions]]/message:-translate-y-16'
      )
    );
  });

  it('lets a host gap on MessageContent win in compact too', () => {
    const { container } = render(
      <div data-density="compact">
        <Message>
          <MessageContent className="gap-0" />
        </Message>
      </div>
    );
    const content = container.querySelector('[data-slot="message-content"]') as HTMLElement;
    expect(content).toHaveClass('gap-0');
    expect(content.className).not.toMatch(/gap-\(/);
  });

  it('halves its gaps and shrinks its text in a compact ancestor', () => {
    const { container } = render(
      <div data-density="compact">
        <MessageGroup>
          <Message>
            <MessageContent>
              <Bubble>
                <BubbleContent>Hi</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageGroup>
      </div>
    );
    const slot = (name: string) => container.querySelector(`[data-slot="${name}"]`);
    expect(slot('message-group')).toHaveClass(
      'gap-(--message-group-gap,0.5rem)',
      'in-data-[density=compact]:[--message-group-gap:0.25rem]'
    );
    expect(slot('message')).toHaveClass(
      'text-(length:--message-font-size,0.875rem)',
      'in-data-[density=compact]:[--message-font-size:0.75rem]'
    );
    expect(slot('message-content')).toHaveClass(
      'gap-(--message-content-gap,0.625rem)',
      'in-data-[density=compact]:[--message-content-gap:0.3125rem]'
    );
    expect(slot('bubble-content')).toHaveClass(
      'px-3',
      'py-2',
      'text-(length:--bubble-font-size,0.875rem)',
      'in-data-[density=compact]:[--bubble-font-size:0.75rem]'
    );
  });

  it('renders a turn with avatar, header, body and footer', () => {
    render(
      <Message>
        <MessageAvatar>AI</MessageAvatar>
        <MessageContent>
          <MessageHeader>Autopilot</MessageHeader>
          <Bubble>
            <BubbleContent>Hello</BubbleContent>
          </Bubble>
          <MessageFooter>Just now</MessageFooter>
        </MessageContent>
      </Message>
    );
    expect(screen.getByText('Autopilot')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Just now').closest('[data-slot=message-footer]')).not.toBeNull();
  });

  it('defaults to start alignment and mirrors the row for end', () => {
    const { rerender } = render(<Message data-testid="row">x</Message>);
    expect(screen.getByTestId('row')).toHaveAttribute('data-align', 'start');
    rerender(
      <Message data-testid="row" align="end">
        x
      </Message>
    );
    expect(screen.getByTestId('row')).toHaveAttribute('data-align', 'end');
    expect(screen.getByTestId('row')).toHaveClass('data-[align=end]:flex-row-reverse');
  });

  it('tags each part with a data-slot', () => {
    render(
      <MessageGroup data-testid="group">
        <Message data-testid="message">
          <MessageAvatar data-testid="avatar" />
          <MessageContent data-testid="content">
            <MessageHeader data-testid="header" />
            <MessageFooter data-testid="footer" />
          </MessageContent>
        </Message>
      </MessageGroup>
    );
    expect(screen.getByTestId('group')).toHaveAttribute('data-slot', 'message-group');
    expect(screen.getByTestId('message')).toHaveAttribute('data-slot', 'message');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-slot', 'message-avatar');
    expect(screen.getByTestId('content')).toHaveAttribute('data-slot', 'message-content');
    expect(screen.getByTestId('header')).toHaveAttribute('data-slot', 'message-header');
    expect(screen.getByTestId('footer')).toHaveAttribute('data-slot', 'message-footer');
  });

  it('forwards refs and merges className', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Message ref={ref} className="custom">
        x
      </Message>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('custom');
    expect(ref.current).toHaveClass('group/message');
  });

  it('hosts an action bar after the body and keeps the avatar level with the bubble', () => {
    render(
      <Message align="end">
        <MessageAvatar data-testid="avatar">U</MessageAvatar>
        <MessageContent data-testid="content">
          <Bubble>
            <BubbleContent>Hello</BubbleContent>
          </Bubble>
          <MessageActions />
        </MessageContent>
      </Message>
    );
    const bar = screen.getByRole('group', { name: 'Message actions' });
    expect(bar).toHaveAttribute('data-slot', 'message-actions');
    expect(screen.getByTestId('content').lastElementChild).toBe(bar);
    expect(screen.getByTestId('content')).toHaveClass('group-data-[align=end]/message:*:self-end');
    expect(screen.getByTestId('avatar')).toHaveClass(
      'group-has-[[data-slot=message-actions]]/message:-translate-y-10'
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Message>
        <MessageContent>
          <MessageHeader>Autopilot</MessageHeader>
          <Bubble>
            <BubbleContent>Hello</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
