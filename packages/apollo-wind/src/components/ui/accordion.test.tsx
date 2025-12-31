import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';

describe('Accordion', () => {
  const AccordionExample = ({ type = 'single' as const, onValueChange = vi.fn() }) => (
    <Accordion type={type} onValueChange={onValueChange} collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>Content for section 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>Content for section 2</AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Section 3</AccordionTrigger>
        <AccordionContent>Content for section 3</AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  it('renders without crashing', () => {
    render(<AccordionExample />);
    expect(screen.getByText('Section 1')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AccordionExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all accordion items', () => {
    render(<AccordionExample />);
    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  it('expands item when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger = screen.getByText('Section 1');
    await user.click(trigger);

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
  });

  it('collapses item when clicked again', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger = screen.getByText('Section 1');
    await user.click(trigger);
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();

    await user.click(trigger);
    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
  });

  it('only allows one item open at a time in single mode', async () => {
    const user = userEvent.setup();
    render(<AccordionExample type="single" />);

    const trigger1 = screen.getByText('Section 1');
    const trigger2 = screen.getByText('Section 2');

    await user.click(trigger1);
    expect(screen.getByText('Content for section 1')).toBeInTheDocument();

    await user.click(trigger2);
    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
  });

  it('allows multiple items open in multiple mode', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger1 = screen.getByText('Section 1');
    const trigger2 = screen.getByText('Section 2');

    await user.click(trigger1);
    await user.click(trigger2);

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
  });

  it('supports keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger = screen.getByText('Section 1');
    trigger.focus();
    await user.keyboard(' ');

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
  });

  it('supports keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger = screen.getByText('Section 1');
    trigger.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
  });

  it('supports keyboard navigation with Arrow Down', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger1 = screen.getByText('Section 1');
    trigger1.focus();
    await user.keyboard('{ArrowDown}');

    const trigger2 = screen.getByText('Section 2');
    expect(trigger2).toHaveFocus();
  });

  it('supports keyboard navigation with Arrow Up', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger2 = screen.getByText('Section 2');
    trigger2.focus();
    await user.keyboard('{ArrowUp}');

    const trigger1 = screen.getByText('Section 1');
    expect(trigger1).toHaveFocus();
  });

  it('supports default value', () => {
    render(
      <Accordion type="single" defaultValue="item-2">
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <Accordion type="single" value="item-1" onValueChange={handleValueChange}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText('Content 1')).toBeInTheDocument();

    const trigger2 = screen.getByText('Section 2');
    await user.click(trigger2);
    expect(handleValueChange).toHaveBeenCalledWith('item-2');

    rerender(
      <Accordion type="single" value="item-2" onValueChange={handleValueChange}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content 2</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('supports disabled items', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="single">
        <AccordionItem value="item-1" disabled>
          <AccordionTrigger>Disabled Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const trigger = screen.getByText('Disabled Section');
    await user.click(trigger);

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('applies custom className to AccordionItem', () => {
    render(
      <Accordion type="single">
        <AccordionItem value="item-1" className="custom-item">
          <AccordionTrigger>Section</AccordionTrigger>
          <AccordionContent>Content</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    const item = screen.getByText('Section').closest('[class*="custom-item"]');
    expect(item).toBeInTheDocument();
  });

  it('has proper ARIA attributes', async () => {
    const user = userEvent.setup();
    render(<AccordionExample />);

    const trigger = screen.getByText('Section 1');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls');
  });

  it('displays chevron icon', () => {
    const { container } = render(<AccordionExample />);
    const chevron = container.querySelector('svg');
    expect(chevron).toBeInTheDocument();
  });
});
