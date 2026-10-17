import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from './attachment';

function Card(props: React.ComponentProps<typeof Attachment>) {
  return (
    <Attachment data-testid="attachment" {...props}>
      <AttachmentMedia data-testid="media">
        <svg aria-hidden="true" />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>report.pdf</AttachmentTitle>
        <AttachmentDescription>1.2 MB</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  );
}

describe('Attachment', () => {
  it('renders media, title and description with defaults', () => {
    render(<Card />);
    const el = screen.getByTestId('attachment');
    expect(el).toHaveAttribute('data-slot', 'attachment');
    expect(el).toHaveAttribute('data-state', 'done');
    expect(el).toHaveAttribute('data-size', 'default');
    expect(el).toHaveAttribute('data-orientation', 'horizontal');
    expect(screen.getByTestId('media')).toHaveAttribute('data-variant', 'icon');
    expect(screen.getByText('report.pdf')).toHaveAttribute('data-slot', 'attachment-title');
    expect(screen.getByText('1.2 MB')).toHaveAttribute('data-slot', 'attachment-description');
  });

  it.each([
    'idle',
    'uploading',
    'processing',
    'error',
    'done',
  ] as const)('exposes state %s on data-state', (state) => {
    render(<Card state={state} />);
    expect(screen.getByTestId('attachment')).toHaveAttribute('data-state', state);
  });

  it('exposes size and orientation', () => {
    render(<Card size="xs" orientation="vertical" />);
    const el = screen.getByTestId('attachment');
    expect(el).toHaveAttribute('data-size', 'xs');
    expect(el).toHaveAttribute('data-orientation', 'vertical');
    expect(el).toHaveClass('flex-col');
  });

  it('renders actions as ghost icon buttons and fires their handlers', async () => {
    const onRemove = vi.fn();
    render(
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove report.pdf" onClick={onRemove}>
            x
          </AttachmentAction>
        </AttachmentActions>
      </Attachment>
    );
    const button = screen.getByRole('button', { name: 'Remove report.pdf' });
    expect(button).toHaveAttribute('data-slot', 'attachment-action');
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('renders a full-card trigger that defaults to type=button', async () => {
    const onOpen = vi.fn();
    render(
      <Attachment>
        <AttachmentTrigger aria-label="Preview report.pdf" onClick={onOpen} />
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    );
    const trigger = screen.getByRole('button', { name: 'Preview report.pdf' });
    expect(trigger).toHaveAttribute('type', 'button');
    await userEvent.click(trigger);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the trigger as its child with asChild', () => {
    render(
      <Attachment>
        <AttachmentTrigger asChild>
          <a href="/report.pdf">Open report</a>
        </AttachmentTrigger>
      </Attachment>
    );
    const link = screen.getByRole('link', { name: 'Open report' });
    expect(link).toHaveAttribute('data-slot', 'attachment-trigger');
    expect(link).not.toHaveAttribute('type');
  });

  it('lays several cards out in a group', () => {
    render(
      <AttachmentGroup data-testid="group">
        <Card />
        <Card />
      </AttachmentGroup>
    );
    expect(screen.getByTestId('group')).toHaveAttribute('data-slot', 'attachment-group');
    expect(screen.getAllByTestId('attachment')).toHaveLength(2);
  });

  it('shows a cut-off title in full in a tooltip, and no tooltip when it fits', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AttachmentTitle>quarterly-reconciliation.xlsx</AttachmentTitle>);
    const title = screen.getByText('quarterly-reconciliation.xlsx');
    Object.defineProperty(title, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(title, 'scrollWidth', { configurable: true, value: 100 });
    await user.hover(title);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await user.unhover(title);

    Object.defineProperty(title, 'scrollWidth', { configurable: true, value: 240 });
    await user.hover(title);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('quarterly-reconciliation.xlsx');
    await user.keyboard('{Escape}');
    await user.unhover(title);
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());

    // Measured on every open: once the name fits again, hovering shows nothing.
    Object.defineProperty(title, 'scrollWidth', { configurable: true, value: 100 });
    await user.hover(title);
    expect(screen.queryByRole('tooltip')).toBeNull();
    await user.unhover(title);

    rerender(
      <AttachmentTitle truncationTooltip={false}>quarterly-reconciliation.xlsx</AttachmentTitle>
    );
    const plain = screen.getByText('quarterly-reconciliation.xlsx');
    Object.defineProperty(plain, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(plain, 'scrollWidth', { configurable: true, value: 240 });
    await user.hover(plain);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('has no accessibility violations with the title tooltip open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>quarterly-reconciliation.xlsx</AttachmentTitle>
        </AttachmentContent>
      </Attachment>
    );
    const title = screen.getByText('quarterly-reconciliation.xlsx');
    Object.defineProperty(title, 'clientWidth', { configurable: true, value: 100 });
    Object.defineProperty(title, 'scrollWidth', { configurable: true, value: 240 });
    await user.hover(title);
    await screen.findByRole('tooltip');
    expect(await axe(container)).toHaveNoViolations();
    // The portalled tooltip too; landmarks are a page concern, not the chip's.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } })
    ).toHaveNoViolations();
  });

  it('forwards refs', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Attachment ref={ref} />);
    expect(ref.current).toHaveAttribute('data-slot', 'attachment');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Attachment>
        <AttachmentContent>
          <AttachmentTitle>report.pdf</AttachmentTitle>
        </AttachmentContent>
        <AttachmentActions>
          <AttachmentAction aria-label="Remove report.pdf">x</AttachmentAction>
        </AttachmentActions>
      </Attachment>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
