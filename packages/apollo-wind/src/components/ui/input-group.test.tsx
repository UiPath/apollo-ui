import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Lock } from 'lucide-react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { cn } from '@/lib';
import { Collapsible, CollapsibleContent } from './collapsible';
import { Combobox } from './combobox';
import { DatePicker, DateRangePicker } from './date-picker';
import { DateTimePicker } from './datetime-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { Input } from './input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupBody,
  InputGroupButton,
  InputGroupInput,
  InputGroupPopoverTrigger,
  InputGroupRow,
  InputGroupText,
  InputGroupTextarea,
  InputGroupTrigger,
  inputGroupVariants,
  useInputGroup,
} from './input-group';
import { MultiSelect } from './multi-select';
import { Popover, PopoverContent } from './popover';
import { Select, SelectContent, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';

const TRIM = 'has-[>[data-slot=input-group-addon][data-align=inline-end]]:pr-2';

/** Reports the anchor it was handed through the DOM, since the ref is empty during render. */
function AnchorProbe() {
  const { anchor } = useInputGroup();
  const el = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (el.current) el.current.dataset.anchor = anchor?.current?.dataset.testid ?? 'none';
  }, [anchor]);
  return <span ref={el} data-testid="probe" data-anchor="pending" />;
}

describe('InputGroup', () => {
  it('renders an input inside the group', () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>
          <Lock />
        </InputGroupAddon>
        <InputGroupInput aria-label="Locked field" />
      </InputGroup>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies ghost variant classes to the wrapper, not the input', () => {
    render(
      <InputGroup variant="ghost" data-testid="group">
        <InputGroupInput placeholder="Ghost" />
      </InputGroup>
    );
    const group = screen.getByTestId('group');
    expect(group).toHaveClass('bg-surface-overlay');
    expect(group).not.toHaveClass('border-input');
    // The input's own border is always zeroed, regardless of the group's variant.
    expect(screen.getByPlaceholderText('Ghost')).toHaveClass('!border-0');
  });

  it('applies xs size classes to the wrapper', () => {
    render(
      <InputGroup size="xs" data-testid="group">
        <InputGroupInput placeholder="Compact" />
      </InputGroup>
    );
    expect(screen.getByTestId('group')).toHaveClass('h-6');
  });

  it('forwards focus to the input when the addon is clicked', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup>
        <InputGroupAddon data-testid="addon">
          <Lock />
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByTestId('addon'));
    expect(screen.getByPlaceholderText('Enter text')).toHaveFocus();
  });

  it('does not steal focus when clicking a button inside the addon', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton onClick={handleClick} aria-label="Lock">
            <Lock />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByRole('button', { name: 'Lock' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Enter text')).not.toHaveFocus();
  });

  it('still calls a consumer-provided onClick on the addon', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupAddon onClick={handleClick} data-testid="addon">
          <Lock />
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByTestId('addon'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state on the input', () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Disabled" disabled />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('stacks inline validation below the grouped input', () => {
    render(
      <InputGroup data-testid="group" error="Enter a unique name before saving.">
        <InputGroupInput id="node-name" />
      </InputGroup>
    );

    expect(screen.getByText('Enter a unique name before saving.')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).toHaveClass('!border-0');
    expect(screen.getByRole('textbox')).toHaveClass('!ring-0');
    expect(screen.getByTestId('group')).toHaveClass(
      'has-[[data-slot][aria-invalid=true]]:border-error'
    );
    expect(screen.getByTestId('group')).toHaveClass(
      'future:has-[[data-slot][aria-invalid=true]]:ring-1'
    );
  });

  it('supports a textarea control', () => {
    render(
      <InputGroup>
        <InputGroupTextarea placeholder="Notes" />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument();
  });

  it('keeps the textarea a direct child of the group, so `has-[>textarea]` still matches', () => {
    render(
      <InputGroup data-testid="group">
        <InputGroupTextarea placeholder="Notes" />
      </InputGroup>
    );
    const group = screen.getByTestId('group');
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea.parentElement).toBe(group);
    expect(group).toHaveClass('has-[>textarea]:h-auto');
  });

  it('pads the textarea by the difference to a standalone Textarea, not its full inset', () => {
    render(
      <InputGroup>
        <InputGroupTextarea placeholder="Notes" />
      </InputGroup>
    );
    const textarea = screen.getByPlaceholderText('Notes');
    expect(textarea).toHaveClass('py-1', 'future:py-0');
    expect(textarea).not.toHaveClass('py-2');
  });

  it('renders InputGroupText content', () => {
    render(
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    );
    expect(screen.getByText('https://')).toBeInTheDocument();
  });

  it('forwards ref to the underlying input', () => {
    const ref = { current: null };
    render(
      <InputGroup>
        <InputGroupInput ref={ref} />
      </InputGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  describe('layout', () => {
    it('keeps the single-row sizing by default', () => {
      render(<InputGroup data-testid="group" />);
      const group = screen.getByTestId('group');
      expect(group).toHaveClass('h-9', 'future:h-10');
      expect(group).not.toHaveClass('h-auto');
    });

    it.each([
      ['grow', ['h-auto', 'min-h-9', 'future:h-auto', 'future:min-h-10']],
      ['block', ['h-auto', 'flex-col', 'gap-0', 'p-0', 'future:h-auto', 'future:p-0']],
      ['fill', ['h-auto', 'min-h-9', 'items-stretch', 'py-0', 'future:h-auto', 'future:min-h-10']],
    ] as const)('lets %s out-rank the row height under future too', (layout, classes) => {
      render(<InputGroup data-testid="group" layout={layout} />);
      const group = screen.getByTestId('group');
      expect(group).toHaveClass(...classes);
      // A bare `h-auto` does not beat the row's `future:h-10`, so the row's has to be gone.
      expect(group).not.toHaveClass('h-9');
      expect(group).not.toHaveClass('future:h-10');
    });

    it.each(['block', 'fill'] as const)('drops the row padding under future for %s', (layout) => {
      render(<InputGroup data-testid="group" layout={layout} />);
      expect(screen.getByTestId('group')).not.toHaveClass('future:py-2');
    });

    it('keeps a growable row centred', () => {
      render(<InputGroup data-testid="group" layout="grow" />);
      expect(screen.getByTestId('group')).not.toHaveClass('items-start');
    });
  });

  describe('variant', () => {
    it('drops the paint but keeps the row geometry when unboxed', () => {
      render(<InputGroup data-testid="group" variant="none" />);
      const group = screen.getByTestId('group');
      expect(group).toHaveClass('h-9', 'px-0', 'pr-3', 'border-0', 'bg-transparent', 'shadow-none');
      expect(group).not.toHaveClass('px-3');
    });

    it('draws a plain border with no fill as outline', () => {
      render(<InputGroup data-testid="group" variant="outline" />);
      const group = screen.getByTestId('group');
      expect(group).toHaveClass(
        'border',
        'bg-transparent',
        'future:border',
        'future:bg-transparent'
      );
      expect(group).not.toHaveClass('future:bg-surface-overlay');
    });
  });

  describe('focus', () => {
    it.each([
      'default',
      'ghost',
      'outline',
      'none',
    ] as const)('rings a %s box while its control shows focus, since the control drops its own ring', (variant) => {
      render(<InputGroup data-testid="group" variant={variant} />);
      expect(screen.getByTestId('group')).toHaveClass(
        'has-[[data-slot=input-group-control]:focus-visible]:ring-2',
        'has-[[data-slot=input-group-control]:focus-visible]:ring-ring'
      );
    });

    it('rings for an element inside the control, such as a code editor’s content', () => {
      render(<InputGroup data-testid="group" />);
      expect(screen.getByTestId('group')).toHaveClass(
        'has-[[data-slot=input-group-control]_:focus-visible]:ring-2',
        'has-[[data-slot=input-group-control]_:focus-visible]:ring-ring'
      );
    });

    it('leaves the box alone while an addon button has focus, since the button rings itself', () => {
      render(<InputGroup data-testid="group" />);
      expect(screen.getByTestId('group').className).not.toMatch(/(^|\s)focus-within:/);
    });

    it('never rings a block box, whose body holds fields that ring themselves', () => {
      render(<InputGroup data-testid="group" layout="block" />);
      const group = screen.getByTestId('group');
      expect(group.className).not.toContain('ring-2');
    });

    it('rings a block group’s row for its own control, inset on the box’s corners', () => {
      render(
        <InputGroup layout="block">
          <InputGroupRow data-testid="row">
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
        </InputGroup>
      );
      expect(screen.getByTestId('row')).toHaveClass(
        'rounded-[inherit]',
        'has-[[data-slot=input-group-control]:focus-visible]:ring-2',
        'has-[[data-slot=input-group-control]:focus-visible]:ring-inset',
        'has-[[data-slot=input-group-control]:focus-visible]:ring-ring'
      );
    });
  });

  describe('hover', () => {
    const HOVER = 'has-[button[data-slot=input-group-control]:not(:disabled):hover]:bg-accent';
    const FUTURE_HOVER =
      'future:has-[button[data-slot=input-group-control]:not(:disabled):hover]:bg-surface-hover';

    it('lights the box while an enabled trigger is hovered, keyed on the trigger alone', () => {
      render(<InputGroup data-testid="group" />);
      // Addons sit beside the trigger, so hovering one matches nothing here.
      expect(screen.getByTestId('group')).toHaveClass(HOVER, FUTURE_HOVER);
    });

    it.each([
      ['an unpainted box', { variant: 'outline' as const }],
      ['an unboxed group', { variant: 'none' as const }],
      ['a block box, which also holds the body', { layout: 'block' as const }],
    ])('leaves %s alone', (_, props) => {
      render(<InputGroup data-testid="group" {...props} />);
      expect(screen.getByTestId('group')).not.toHaveClass(HOVER);
    });
  });

  describe('controlled state', () => {
    it('draws the invalid state on the error token and rings in error when focused', () => {
      render(<InputGroup data-testid="group" invalid />);
      const group = screen.getByTestId('group');
      expect(group).toHaveAttribute('data-invalid');
      expect(group).toHaveClass('border-error', 'future:ring-1', 'future:ring-error/40');
      expect(group).toHaveClass('has-[[data-slot=input-group-control]:focus-visible]:ring-error');
      expect(group).not.toHaveClass(
        'has-[[data-slot=input-group-control]:focus-visible]:ring-ring'
      );
      expect(group.className).not.toContain('destructive');
    });

    it('recolours the focus ring for a control that reports itself invalid', () => {
      render(<InputGroup data-testid="group" />);
      expect(screen.getByTestId('group')).toHaveClass(
        'has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-error'
      );
    });

    it('keeps a resting invalid edge on a block box under future', () => {
      render(<InputGroup data-testid="group" layout="block" invalid />);
      expect(screen.getByTestId('group')).toHaveClass('future:ring-1', 'future:ring-error/40');
    });

    it('keeps an outline group red under future, where it keeps its border', () => {
      render(<InputGroup data-testid="group" variant="outline" invalid />);
      const group = screen.getByTestId('group');
      expect(group).toHaveClass('border-error', 'future:border-error');
      expect(group).not.toHaveClass('future:border-input');
      expect(group).toHaveClass('future:has-[[data-slot][aria-invalid=true]]:border-error');
    });

    it('paints no invalid edge when unboxed', () => {
      render(<InputGroup data-testid="group" variant="none" invalid />);
      const group = screen.getByTestId('group');
      expect(group).toHaveAttribute('data-invalid');
      expect(group).not.toHaveClass('border-error');
      expect(group).not.toHaveClass('future:ring-1');
    });

    it('dims the group when disabled', () => {
      render(<InputGroup data-testid="group" disabled />);
      const group = screen.getByTestId('group');
      expect(group).toHaveAttribute('data-disabled');
      expect(group).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('leaves both states off by default', () => {
      render(<InputGroup data-testid="group" />);
      const group = screen.getByTestId('group');
      expect(group).not.toHaveAttribute('data-invalid');
      expect(group).not.toHaveAttribute('data-disabled');
      expect(group).not.toHaveClass('border-error');
    });
  });

  it('trims the right padding by the slack a trailing addon brings, in both themes', () => {
    render(<InputGroup data-testid="group" />);
    expect(screen.getByTestId('group')).toHaveClass(TRIM, `future:${TRIM}`);
  });

  it('keeps the trim on a fill box, which states its padding by side rather than shorthand', () => {
    // A `p-0`/`px-0` shorthand would survive `cn` beside the trim and settle the right edge on
    // stylesheet order.
    render(<InputGroup data-testid="group" layout="fill" />);
    const group = screen.getByTestId('group');
    expect(group.className.split(/\s+/).filter((c) => /^(future:)?p-\d/.test(c))).toEqual([]);
    expect(group).toHaveClass('pr-0', 'future:pr-0', TRIM, `future:${TRIM}`);
  });

  describe('addon click', () => {
    it('focuses the slotted control, not a hidden textarea inside a div-hosted control', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup>
          <InputGroupAddon data-testid="addon">
            <Lock />
          </InputGroupAddon>
          {/* A code editor: a focusable host carrying the slot, with a hidden textarea inside. */}
          <div data-slot="input-group-control" tabIndex={-1} data-testid="editor">
            <textarea aria-hidden="true" tabIndex={-1} data-testid="hidden-textarea" />
          </div>
        </InputGroup>
      );

      await user.click(screen.getByTestId('addon'));
      expect(screen.getByTestId('hidden-textarea')).not.toHaveFocus();
      expect(screen.getByTestId('editor')).toHaveFocus();
    });

    it('focuses nothing when the group has no slotted control', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup>
          <InputGroupAddon data-testid="addon">
            <Lock />
          </InputGroupAddon>
          <textarea data-testid="bare" />
        </InputGroup>
      );

      await user.click(screen.getByTestId('addon'));
      expect(screen.getByTestId('bare')).not.toHaveFocus();
    });

    it('leaves focus on a field inside the addon', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup>
          <InputGroupAddon>
            <Input aria-label="Unit" />
          </InputGroupAddon>
          <Input aria-label="Amount" />
        </InputGroup>
      );

      await user.click(screen.getByLabelText('Unit'));
      expect(screen.getByLabelText('Unit')).toHaveFocus();
    });

    it('leaves focus alone when focusControlOnClick is off', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup>
          <InputGroupAddon data-testid="addon" focusControlOnClick={false}>
            <Lock />
          </InputGroupAddon>
          <InputGroupInput placeholder="Enter text" />
        </InputGroup>
      );

      await user.click(screen.getByTestId('addon'));
      expect(screen.getByPlaceholderText('Enter text')).not.toHaveFocus();
    });
  });

  describe('InputGroupTrigger', () => {
    it("is the group's control, painting nothing of its own", () => {
      render(
        <InputGroup>
          <InputGroupTrigger>Pick one</InputGroupTrigger>
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Pick one' });
      expect(trigger).toHaveAttribute('data-slot', 'input-group-control');
      expect(trigger).toHaveAttribute('type', 'button');
      expect(trigger).toHaveClass('border-0', 'bg-transparent', 'p-0', 'future:text-foreground');
      expect(trigger).toHaveClass('focus-visible:ring-0');
    });

    it.each([
      ['InputGroupTrigger', () => <InputGroupTrigger>Pick one</InputGroupTrigger>],
      [
        'InputGroupPopoverTrigger',
        () => (
          <Popover>
            <InputGroupPopoverTrigger>Pick one</InputGroupPopoverTrigger>
          </Popover>
        ),
      ],
    ])('%s points at the group’s message, as the other grouped controls do', (_, Trigger) => {
      render(
        <InputGroup error="Required" errorId="group-error">
          <Trigger />
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Pick one' });
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAttribute('aria-describedby', 'group-error');
      expect(trigger).toHaveAttribute('aria-errormessage', 'group-error');
    });

    it('keeps a caller’s own validation attributes', () => {
      render(
        <InputGroupTrigger aria-invalid aria-describedby="hint" aria-errormessage="own">
          Pick one
        </InputGroupTrigger>
      );
      const trigger = screen.getByRole('button', { name: 'Pick one' });
      expect(trigger).toHaveAttribute('aria-invalid', 'true');
      expect(trigger).toHaveAttribute('aria-describedby', 'hint');
      expect(trigger).toHaveAttribute('aria-errormessage', 'own');
    });

    it('keeps one line of height when empty', () => {
      render(<InputGroupTrigger aria-label="Empty" />);
      expect(screen.getByRole('button', { name: 'Empty' })).toHaveClass('flex', 'min-h-5');
    });

    it('sizes to its content as a block row, leaving the focus ring to the row', () => {
      render(
        <InputGroup layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Filters' });
      expect(trigger).toHaveClass('h-auto', 'min-h-9', 'future:min-h-10', 'focus-visible:ring-0');
    });

    it('keeps the row look in a block body, which is outside the group', () => {
      render(
        <InputGroup layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
          <InputGroupBody>
            <InputGroupTrigger>Nested</InputGroupTrigger>
          </InputGroupBody>
        </InputGroup>
      );
      const nested = screen.getByRole('button', { name: 'Nested' });
      expect(nested).toHaveClass('focus-visible:ring-0');
      expect(nested).not.toHaveClass('min-h-9');
    });

    it("takes the row's free width and can shrink to truncate", () => {
      render(<InputGroupTrigger>Pick one</InputGroupTrigger>);
      expect(screen.getByRole('button', { name: 'Pick one' })).toHaveClass('min-w-0', 'flex-1');
    });

    it('lets a caller’s placeholder colour win over the resting colour', () => {
      render(
        <InputGroupTrigger className="future:text-muted-foreground/60">
          placeholder
        </InputGroupTrigger>
      );
      const trigger = screen.getByRole('button', { name: 'placeholder' });
      expect(trigger).toHaveClass('future:text-muted-foreground/60');
      expect(trigger).not.toHaveClass('future:text-foreground');
    });
  });

  describe('InputGroupPopoverTrigger', () => {
    const trigger = () => screen.getByRole('button', { name: /pick/i });

    it("is the group's control, with no box of its own", () => {
      render(
        <InputGroup>
          <Popover>
            <InputGroupPopoverTrigger aria-label="pick">value</InputGroupPopoverTrigger>
          </Popover>
        </InputGroup>
      );
      expect(trigger()).toHaveAttribute('data-slot', 'input-group-control');
      expect(trigger()).toHaveClass('border-0', 'bg-transparent');
      expect(trigger()).not.toHaveClass('border-input');
      expect(trigger()).not.toHaveClass('h-9');
    });

    it('shows the placeholder, dimmed, beside its caret when there is no value', () => {
      render(
        <Popover>
          <InputGroupPopoverTrigger aria-label="pick" placeholder="Choose a queue">
            {undefined}
          </InputGroupPopoverTrigger>
        </Popover>
      );
      expect(screen.getByText('Choose a queue')).toHaveClass('text-muted-foreground');
      expect(trigger().querySelector('svg')).not.toBeNull();
    });

    it('drops the caret for a trigger that brings its own', () => {
      render(
        <Popover>
          <InputGroupPopoverTrigger aria-label="pick" caret={false}>
            value
          </InputGroupPopoverTrigger>
        </Popover>
      );
      expect(trigger().querySelector('svg')).toBeNull();
    });

    it('positions its panel against the group box', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup data-testid="box">
          <Popover>
            <InputGroupPopoverTrigger aria-label="pick">value</InputGroupPopoverTrigger>
            <PopoverContent>panel</PopoverContent>
          </Popover>
        </InputGroup>
      );
      const measure = vi.spyOn(screen.getByTestId('box'), 'getBoundingClientRect');

      await user.click(trigger());
      await waitFor(() => expect(measure).toHaveBeenCalled());
    });
  });

  describe('addons on the first line', () => {
    const addonIn = (layout: 'row' | 'grow' | 'block' | 'fill') => {
      const { container, unmount } = render(
        <InputGroup layout={layout}>
          <InputGroupTrigger>control</InputGroupTrigger>
          <InputGroupAddon align="inline-end">
            <button type="button">mode</button>
          </InputGroupAddon>
        </InputGroup>
      );
      return { addon: container.querySelector('[data-slot="input-group-addon"]'), unmount };
    };

    it('leaves a row addon as it was, since the row is one line already', () => {
      const { addon } = addonIn('row');
      expect(addon).not.toHaveClass('self-stretch');
      expect(addon?.className).not.toContain('max-h-');
    });

    it('stretches a growable addon to the row, capped at one line of content', () => {
      const { addon } = addonIn('grow');
      expect(addon).toHaveClass('shrink-0', 'self-stretch', 'max-h-6.5', 'future:max-h-6');
    });

    it('caps block and fill addons at the full row, since those boxes have no vertical padding', () => {
      for (const layout of ['block', 'fill'] as const) {
        const { addon, unmount } = addonIn(layout);
        expect(addon).toHaveClass('max-h-9', 'future:max-h-10');
        unmount();
      }
    });

    it('hides an addon whose content renders nothing', () => {
      const Nothing = () => null;
      const { container } = render(
        <InputGroup>
          <InputGroupAddon>
            <Nothing />
          </InputGroupAddon>
          <InputGroupInput aria-label="Value" />
        </InputGroup>
      );
      const addon = container.querySelector('[data-slot="input-group-addon"]');
      expect(addon).toBeEmptyDOMElement();
      expect(addon).toHaveClass('empty:hidden');
    });
  });

  describe('block layout', () => {
    it('stacks a row above a body behind a divider', () => {
      render(
        <InputGroup data-testid="group" layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
          <InputGroupBody>
            <p>conditions</p>
          </InputGroupBody>
        </InputGroup>
      );
      expect(screen.getByTestId('group')).toHaveClass('flex-col', 'p-0');
      expect(screen.getByText('conditions').parentElement).toHaveClass('border-t');
    });

    it('pads the row, whose trailing addon the box’s direct-child trim cannot reach', () => {
      const { container } = render(
        <InputGroup data-testid="group" layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
            <InputGroupAddon align="inline-end">
              <button type="button">mode</button>
            </InputGroupAddon>
          </InputGroupRow>
        </InputGroup>
      );
      const group = screen.getByTestId('group');
      expect(group.querySelector(':scope > [data-slot="input-group-addon"]')).toBeNull();
      const row = container.querySelector('[data-slot="input-group-row"]');
      expect(row).toHaveClass('px-3', TRIM, 'min-h-9', 'future:min-h-10');
    });

    it('drops the divider when a collapsible body is closed', () => {
      const { container } = render(
        <Collapsible open={false}>
          <InputGroup layout="block">
            <InputGroupRow>
              <InputGroupTrigger>Filters</InputGroupTrigger>
            </InputGroupRow>
            <InputGroupBody>
              <CollapsibleContent>rows</CollapsibleContent>
            </InputGroupBody>
          </InputGroup>
        </Collapsible>
      );
      // Radix leaves a closed collapsible's content in place with `hidden`, so `empty:` alone
      // would never fire.
      const body = container.querySelector('[data-slot="input-group-body"]') as HTMLElement;
      expect(body).toHaveClass('empty:border-t-0', 'has-[>[hidden]]:border-t-0');
      expect(body.querySelector(':scope > [hidden]')).not.toBeNull();
    });

    it('keeps the group’s validation out of the body', () => {
      render(
        <InputGroup layout="block" error="Pick at least one">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
          <InputGroupBody>
            <InputGroupInput aria-label="Nested" />
          </InputGroupBody>
        </InputGroup>
      );
      expect(screen.getByRole('textbox', { name: 'Nested' })).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('popover anchor', () => {
    it('publishes the box to controls inside the group', () => {
      render(
        <InputGroup data-testid="box">
          <AnchorProbe />
        </InputGroup>
      );
      expect(screen.getByTestId('probe')).toHaveAttribute('data-anchor', 'box');
    });

    it('publishes none outside a group, so a bare picker anchors to itself', () => {
      render(<AnchorProbe />);
      expect(screen.getByTestId('probe')).toHaveAttribute('data-anchor', 'none');
    });

    it('stops at a block body, so nested pickers anchor to their own group', () => {
      render(
        <InputGroup data-testid="box" layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
          <InputGroupBody>
            <AnchorProbe />
          </InputGroupBody>
        </InputGroup>
      );
      expect(screen.getByTestId('probe')).toHaveAttribute('data-anchor', 'none');
    });
  });

  describe('popup content', () => {
    it('holds standard fields, though a popup keeps the React context of its trigger', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup error="Pick a time">
          <DateTimePicker />
        </InputGroup>
      );

      await user.click(screen.getByRole('button'));
      const time = document.querySelector('input[type="time"]');
      expect(time).toHaveAttribute('data-slot', 'input');
      expect(time).not.toHaveAttribute('aria-invalid');
    });

    it('holds standard fields in a grouped Select’s and dropdown menu’s panels too', () => {
      render(
        <>
          <InputGroup error="Required">
            <Select defaultOpen>
              <SelectTrigger aria-label="Region">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <Input aria-label="In select" />
              </SelectContent>
            </Select>
          </InputGroup>
          <InputGroup error="Required">
            <DropdownMenu defaultOpen>
              <DropdownMenuTrigger asChild>
                <InputGroupTrigger>Menu</InputGroupTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <Input aria-label="In menu" />
              </DropdownMenuContent>
            </DropdownMenu>
          </InputGroup>
        </>
      );
      // An open menu hides the rest of the page from assistive technology, so query by label.
      for (const name of ['In select', 'In menu']) {
        const field = document.querySelector(`[aria-label="${name}"]`);
        expect(field).toHaveAttribute('data-slot', 'input');
        expect(field).not.toHaveAttribute('aria-invalid');
      }
    });
  });

  describe('inputGroupVariants', () => {
    it('gives a custom box the same classes the group renders, once merged with cn', () => {
      render(<InputGroup data-testid="group" variant="outline" invalid />);
      const rendered = screen.getByTestId('group').className.split(/\s+/).sort();
      const exported = cn(inputGroupVariants({ variant: 'outline', invalid: true }))
        .split(/\s+/)
        .sort();
      expect(rendered).toEqual(exported);
    });
  });

  describe('Apollo controls', () => {
    const items = [{ value: 'a', label: 'A' }];
    type ControlProps = { error?: React.ReactNode };
    const CONTROLS: [string, (p: ControlProps) => React.ReactElement][] = [
      ['Input', (p) => <Input aria-label="c" {...p} />],
      ['Textarea', (p) => <Textarea aria-label="c" {...p} />],
      [
        'Select',
        (p) => (
          <Select>
            <SelectTrigger aria-label="c" {...p}>
              <SelectValue placeholder="p" />
            </SelectTrigger>
          </Select>
        ),
      ],
      [
        'MultiSelect',
        (p) => <MultiSelect options={items} selected={[]} onChange={() => {}} {...p} />,
      ],
      ['Combobox', (p) => <Combobox items={items} {...p} />],
      ['DatePicker', (p) => <DatePicker {...p} />],
      ['DateRangePicker', (p) => <DateRangePicker {...p} />],
      ['DateTimePicker', (p) => <DateTimePicker {...p} />],
    ];
    const control = (root: Element) => root.querySelector('input, textarea, button') as HTMLElement;
    const slot = 'input-group-control';

    it.each(CONTROLS)('%s becomes the group’s control with nothing to set', (_, Control) => {
      const { container } = render(
        <InputGroup>
          <Control />
        </InputGroup>
      );
      expect(control(container)).toHaveAttribute('data-slot', slot);
    });

    it.each(CONTROLS)('%s keeps its own box outside a group', (_, Control) => {
      const { container } = render(<Control />);
      expect(control(container)).not.toHaveAttribute('data-slot', slot);
    });

    it.each(CONTROLS)('%s is a standard field in a block body', (_, Control) => {
      const { container } = render(
        <InputGroup layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
          </InputGroupRow>
          <InputGroupBody>
            <Control />
          </InputGroupBody>
        </InputGroup>
      );
      const body = container.querySelector('[data-slot="input-group-body"]') as HTMLElement;
      expect(control(body)).not.toHaveAttribute('data-slot', slot);
    });

    it.each(CONTROLS)('%s keeps its own look in an addon, apart from the control', (_, Control) => {
      const { container } = render(
        <InputGroup>
          <InputGroupInput aria-label="Value" />
          <InputGroupAddon align="inline-end">
            <Control />
          </InputGroupAddon>
        </InputGroup>
      );
      const addon = container.querySelector('[data-slot="input-group-addon"]') as HTMLElement;
      expect(control(addon)).not.toHaveAttribute('data-slot', slot);
    });

    it.each(CONTROLS)('%s points at the group’s message, rendered once', (_, Control) => {
      const { container } = render(
        <InputGroup error="Required" errorId="group-error">
          <Control />
        </InputGroup>
      );
      const el = control(container);
      expect(el).toHaveAttribute('aria-invalid', 'true');
      expect(el.getAttribute('aria-describedby')?.split(' ')).toContain('group-error');
      expect(el).toHaveAttribute('aria-errormessage', 'group-error');
      expect(screen.getAllByText('Required')).toHaveLength(1);
    });

    it.each(
      CONTROLS
    )('%s shows its own error below the box when the group has none', async (_, Control) => {
      const { container } = render(
        <InputGroup errorId="group-error">
          <Control error="Too long" />
        </InputGroup>
      );
      const el = control(container);
      expect(el).toHaveAttribute('aria-invalid', 'true');
      expect(el.getAttribute('aria-describedby')?.split(' ')).toContain('group-error');
      expect(el).toHaveAttribute('aria-errormessage', 'group-error');
      await waitFor(() =>
        expect(document.getElementById('group-error')).toHaveTextContent('Too long')
      );
      const box = container.querySelector('[data-slot="input-group"]');
      expect(box).not.toContainElement(document.getElementById('group-error'));
      expect(screen.getAllByText('Too long')).toHaveLength(1);
    });

    it('shows the group’s own error over the control’s', async () => {
      render(
        <InputGroup error="Required" errorId="group-error">
          <Input aria-label="Value" error="Too long" />
        </InputGroup>
      );
      await waitFor(() =>
        expect(document.getElementById('group-error')).toHaveTextContent('Required')
      );
      expect(screen.queryByText('Too long')).toBeNull();
    });

    it('drops the control’s message from the group once its error clears', async () => {
      const { rerender } = render(
        <InputGroup errorId="group-error">
          <Input aria-label="Value" error="Too long" />
        </InputGroup>
      );
      await screen.findByText('Too long');
      rerender(
        <InputGroup errorId="group-error">
          <Input aria-label="Value" />
        </InputGroup>
      );
      await waitFor(() => expect(screen.queryByText('Too long')).toBeNull());
      expect(screen.getByRole('textbox', { name: 'Value' })).not.toHaveAttribute('aria-invalid');
    });

    it.each(CONTROLS)('%s is marked invalid by the group’s invalid', (_, Control) => {
      const { container } = render(
        <InputGroup invalid>
          <Control />
        </InputGroup>
      );
      expect(control(container)).toHaveAttribute('aria-invalid', 'true');
    });

    it.each(CONTROLS)('%s is disabled by the group’s disabled', (_, Control) => {
      const { container } = render(
        <InputGroup disabled>
          <Control />
        </InputGroup>
      );
      expect(control(container)).toBeDisabled();
    });

    it('disables the addons and body of a disabled group too', () => {
      const { container } = render(
        <InputGroup disabled layout="block">
          <InputGroupRow>
            <InputGroupTrigger>Filters</InputGroupTrigger>
            <InputGroupAddon align="inline-end">
              <InputGroupButton aria-label="Options">…</InputGroupButton>
            </InputGroupAddon>
          </InputGroupRow>
          <InputGroupBody>
            <Input aria-label="Nested" />
          </InputGroupBody>
        </InputGroup>
      );
      expect(container.querySelector('[data-slot="input-group"]')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      expect(screen.getByRole('button', { name: 'Filters' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Options' })).toBeDisabled();
      expect(screen.getByRole('textbox', { name: 'Nested' })).toBeDisabled();
    });

    it('lists the group’s message once when the host already points at it', () => {
      render(
        <InputGroup error="Required" errorId="group-error">
          <Input aria-label="Value" aria-describedby="group-error hint" />
        </InputGroup>
      );
      expect(screen.getByRole('textbox', { name: 'Value' })).toHaveAttribute(
        'aria-describedby',
        'group-error hint'
      );
    });

    it('keeps InputGroupInput and InputGroupTextarea a group’s control outside a group', () => {
      render(
        <>
          <InputGroupInput aria-label="Input" />
          <InputGroupTextarea aria-label="Textarea" />
        </>
      );
      expect(screen.getByRole('textbox', { name: 'Input' })).toHaveAttribute('data-slot', slot);
      expect(screen.getByRole('textbox', { name: 'Textarea' })).toHaveAttribute('data-slot', slot);
    });

    it('lets InputGroupInput outside a group render its own message, with no group to host it', () => {
      render(<InputGroupInput aria-label="Input" error="Too long" errorId="own" />);
      expect(screen.getByText('Too long')).toHaveAttribute('id', 'own');
      expect(screen.getByRole('textbox', { name: 'Input' })).toHaveAttribute(
        'aria-errormessage',
        'own'
      );
    });
  });

  describe('ref', () => {
    it('keeps a callback ref attached across renders', () => {
      const ref = vi.fn();
      const { rerender } = render(<InputGroup ref={ref} />);
      expect(ref).toHaveBeenCalledTimes(1);
      expect(ref).toHaveBeenLastCalledWith(expect.any(HTMLDivElement));

      rerender(<InputGroup ref={ref} invalid />);
      rerender(<InputGroup ref={ref} disabled />);
      // Re-attaching on every commit would detach (null) and attach again each time.
      expect(ref).toHaveBeenCalledTimes(1);
    });

    it('writes an object ref too', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<InputGroup ref={ref} data-testid="group" />);
      expect(ref.current).toBe(screen.getByTestId('group'));
    });
  });
});
