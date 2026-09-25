import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup } from './input-group';
import { MultiSelect } from './multi-select';

const mockOptions = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
];

describe('MultiSelect', () => {
  it('renders with placeholder', () => {
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        placeholder="Select frameworks..."
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select frameworks...')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect options={mockOptions} selected={['react']} onChange={onChange} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('uses aria-label for its accessible name when no id is provided', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react']} onChange={onChange} />);
    expect(screen.getByRole('combobox', { name: '1 item selected' })).toBeInTheDocument();
  });

  it('pluralizes the aria-label when more than one item is selected', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />);
    expect(screen.getByRole('combobox', { name: '2 items selected' })).toBeInTheDocument();
  });

  it('lets an associated label name the field instead of the aria-label when an id is provided', () => {
    const onChange = vi.fn();
    render(
      <>
        <label htmlFor="frameworks">Frameworks</label>
        <MultiSelect
          id="frameworks"
          options={mockOptions}
          selected={['react']}
          onChange={onChange}
        />
      </>
    );
    expect(screen.getByRole('combobox', { name: 'Frameworks' })).toBeInTheDocument();
  });

  it('renders with default placeholder when none provided', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);
    expect(screen.getByText('Select items...')).toBeInTheDocument();
  });

  it('displays selected items as badges', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />);
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Vue')).toBeInTheDocument();
  });

  it('opens popover when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Command input should be visible when popover is open
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('calls onBlur when the popover closes, not when focus enters it', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} onBlur={onBlur} />);

    await user.click(screen.getByRole('combobox'));
    expect(onBlur).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('allows selecting items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Click on React option
    const reactOption = screen.getByRole('option', { name: /react/i });
    await user.click(reactOption);

    expect(onChange).toHaveBeenCalledWith(['react']);
  });

  it('allows deselecting items by clicking badge X', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />
    );

    // Find the X button (span with role="button") in the React badge
    const badges = container.querySelectorAll('.mr-1');
    const reactBadgeButton = badges[0].querySelector('[role="button"]');

    if (reactBadgeButton) {
      await user.click(reactBadgeButton);
      expect(onChange).toHaveBeenCalledWith(['vue']);
    }
  });

  it('respects maxSelected limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue']}
        onChange={onChange}
        maxSelected={2}
      />
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    // Try to select Angular (should be disabled)
    const angularOption = screen.getByRole('option', { name: /angular/i });
    expect(angularOption).toHaveClass('opacity-50', 'cursor-not-allowed');

    await user.click(angularOption);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows clear all button when items are selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={onChange} />);

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    const clearButton = screen.getByRole('button', {
      name: /clear all \(2\)/i,
    });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('displays custom empty message', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={[]}
        selected={[]}
        onChange={onChange}
        emptyMessage="No frameworks available"
      />
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    expect(screen.getByText('No frameworks available')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    const onChange = vi.fn();
    render(<MultiSelect options={mockOptions} selected={[]} onChange={onChange} disabled />);

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeDisabled();
  });

  it('accepts custom className', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        className="custom-multi-select"
      />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-multi-select');
  });

  it('uses custom search placeholder', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={onChange}
        searchPlaceholder="Find framework..."
      />
    );

    const combobox = screen.getByRole('combobox');
    await user.click(combobox);

    expect(screen.getByPlaceholderText('Find framework...')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    const onChange = vi.fn();
    render(<MultiSelect ref={ref} options={mockOptions} selected={[]} onChange={onChange} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  describe('value vs placeholder color', () => {
    it('mutes the placeholder via its own span', () => {
      render(
        <MultiSelect
          options={mockOptions}
          selected={[]}
          onChange={vi.fn()}
          placeholder="Select frameworks..."
        />
      );
      const placeholder = screen.getByText('Select frameworks...');
      expect(placeholder.tagName).toBe('SPAN');
      expect(placeholder).toHaveClass('text-foreground-muted');
    });

    it('overrides the outline variant so the trigger is not globally muted', () => {
      render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('future:text-foreground');
      expect(trigger).not.toHaveClass('future:text-muted-foreground');
    });
  });
});

describe('MultiSelect inline validation', () => {
  const options = [
    { label: 'Intake', value: 'intake' },
    { label: 'Review', value: 'review' },
  ];

  it('renders the message and wires aria attributes to it', () => {
    render(
      <MultiSelect
        id="stages"
        options={options}
        selected={[]}
        onChange={() => {}}
        error="Select at least one stage."
      />
    );
    const trigger = screen.getByRole('combobox');
    const message = screen.getByText('Select at least one stage.');

    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-describedby', 'stages-error');
    expect(trigger).toHaveAttribute('aria-errormessage', 'stages-error');
    expect(message).toHaveAttribute('id', 'stages-error');
    expect(message).toHaveClass('text-error');
  });

  it('still forwards a bare aria-invalid without rendering a message', () => {
    render(<MultiSelect options={options} selected={[]} onChange={() => {}} aria-invalid />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-describedby');
  });

  describe('trigger in an input group', () => {
    it("becomes the group's control and paints nothing of its own", () => {
      render(
        <InputGroup>
          <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />
        </InputGroup>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveAttribute('data-slot', 'input-group-control');
      expect(trigger).toHaveClass('border-0', 'bg-transparent', 'p-0');
      expect(trigger).not.toHaveClass('h-10');
      expect(trigger).not.toHaveClass('future:bg-surface-overlay');
    });

    it('grows with its chips', () => {
      render(
        <InputGroup>
          <MultiSelect options={mockOptions} selected={['react', 'vue']} onChange={vi.fn()} />
        </InputGroup>
      );
      expect(screen.getByRole('combobox')).toHaveClass('h-auto');
    });

    it('keeps its caret on the first chip row as the chips wrap', () => {
      render(
        <InputGroup>
          <MultiSelect
            options={mockOptions}
            selected={['react', 'vue', 'angular']}
            onChange={vi.fn()}
          />
        </InputGroup>
      );
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveClass('items-start');
      const caret = trigger.querySelector('svg.lucide-chevrons-up-down')?.parentElement;
      expect(caret).toHaveClass('self-start', 'h-6.5', 'future:h-6');
    });

    it("takes the group row's free width", () => {
      const { container } = render(
        <InputGroup>
          <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />
        </InputGroup>
      );
      expect(container.querySelector('[data-slot="multi-select"]')).toHaveClass(
        'min-w-0',
        'flex-1'
      );
    });

    it('keeps the outline trigger outside a group', () => {
      render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />);
      const trigger = screen.getByRole('combobox');
      expect(trigger).not.toHaveAttribute('data-slot', 'input-group-control');
      expect(trigger).toHaveClass('h-10', 'border');
    });
  });

  describe('popover anchor', () => {
    it('positions the panel against the group box when there is one', async () => {
      const user = userEvent.setup();
      render(
        <InputGroup data-testid="box">
          <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />
        </InputGroup>
      );
      const measure = vi.spyOn(screen.getByTestId('box'), 'getBoundingClientRect');

      await user.click(screen.getByRole('combobox'));
      await waitFor(() => expect(measure).toHaveBeenCalled());
    });

    it('sizes the panel to the anchor with a real CSS variable reference', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />);
      await user.click(screen.getByRole('combobox'));
      const panel = await screen.findByRole('dialog');
      // `w-[--x]` compiles to `width: --x` under Tailwind v4, which is no width at all.
      expect(panel).toHaveClass('w-(--radix-popover-trigger-width)');
    });
  });
});
