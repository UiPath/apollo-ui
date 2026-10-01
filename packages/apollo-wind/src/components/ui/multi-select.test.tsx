import { act, render, screen, waitFor } from '@testing-library/react';
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

    it('says what the remove control does, without a provider from the consumer', async () => {
      const user = userEvent.setup();
      render(<MultiSelect options={mockOptions} selected={['react']} onChange={vi.fn()} />);
      const remove = screen.getByRole('button', { name: 'Remove React' });
      // Its own hover, distinct from the badge's.
      expect(remove).toHaveClass('hover:bg-foreground/15');

      await user.hover(remove);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Remove React');
    });

    it('lights a hovered badge rather than the field around it', () => {
      render(<MultiSelect options={mockOptions} selected={['react']} onChange={vi.fn()} />);
      const badge = screen.getByText('React').closest('[data-slot="badge"]');
      expect(badge).toHaveClass('future:hover:bg-surface-hover');
      expect(badge).not.toHaveClass('future:hover:bg-surface-raised');
      // The field stays at rest while a badge inside it is hovered.
      expect(screen.getByRole('combobox')).toHaveClass(
        'future:hover:bg-surface-overlay',
        'future:[&:hover:not(:has([data-slot=badge]:hover))]:bg-surface-hover'
      );
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

describe('MultiSelect option details', () => {
  const people = [
    {
      label: 'Avery Stone',
      value: 'U7K2M9QX1',
      description: 'avery.stone@example.com',
      keywords: ['U7K2M9QX1'],
    },
    {
      label: 'Blake Rivera',
      value: 'U3H8T4LW6',
      description: 'blake.rivera@example.com',
      keywords: ['U3H8T4LW6'],
    },
  ];

  it('shows the description on the row and searches it', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={people} selected={[]} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByText('avery.stone@example.com')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search...'), 'blake.rivera@');
    expect(screen.getByRole('option', { name: /Blake Rivera/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Avery Stone/ })).not.toBeInTheDocument();
  });

  it('finds a row by a keyword it does not print', async () => {
    const user = userEvent.setup();
    render(<MultiSelect options={people} selected={[]} onChange={vi.fn()} />);
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'u3h8t4');
    expect(screen.getByRole('option', { name: /Blake Rivera/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Avery Stone/ })).not.toBeInTheDocument();
  });
});

describe('MultiSelect collapse', () => {
  // Per-label overrides, keyed by the option value the badge shows.
  const offsetWidthFor: Record<string, number> = {};
  const widthOf = (el: HTMLElement) => {
    if (el.getAttribute('data-slot') !== 'badge') return 0;
    if (el.textContent?.includes('more')) return 60;
    if (el.textContent?.startsWith('React Native') && offsetWidthFor.react)
      return offsetWidthFor.react;
    return 80;
  };

  const mockLayout = (containerWidth: number) => {
    const offsetWidth = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return widthOf(this);
      });
    const clientWidth = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(() => containerWidth);
    return () => {
      offsetWidth.mockRestore();
      clientWidth.mockRestore();
    };
  };

  it('keeps the field one line tall', () => {
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue', 'angular']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('h-10');
    expect(trigger).not.toHaveClass('h-auto');
  });

  it('shows every badge and no count when they all fit', () => {
    const restore = mockLayout(400);
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue', 'angular']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('React').closest('[data-slot="badge"]')).not.toHaveClass('invisible');
    expect(screen.getByText('Angular').closest('[data-slot="badge"]')).not.toHaveClass('invisible');
    expect(screen.getByText(/more$/).closest('[data-slot="badge"]')).toHaveClass('invisible');
    restore();
  });

  it('counts the badges that do not fit', () => {
    // Four 80px badges overflow 200px. Beside the 60px chip there is room for one: 84 + 80 > 200 - 64.
    const restore = mockLayout(200);
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue', 'angular', 'svelte']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('React').closest('[data-slot="badge"]')).not.toHaveClass('invisible');
    expect(screen.getByText('Vue').closest('[data-slot="badge"]')).toHaveClass('invisible');
    expect(screen.getByText('+3 more')).not.toHaveClass('invisible');
    restore();
  });

  it('re-measures when the field is resized', () => {
    let width = 400;
    const offsetWidth = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockImplementation(function (this: HTMLElement) {
        return widthOf(this);
      });
    const clientWidth = vi
      .spyOn(HTMLElement.prototype, 'clientWidth', 'get')
      .mockImplementation(() => width);
    const callbacks: (() => void)[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          callbacks.push(callback);
        }
        observe() {}
        disconnect() {}
      }
    );

    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue', 'angular', 'svelte']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('Vue').closest('[data-slot="badge"]')).not.toHaveClass('invisible');

    width = 200;
    act(() => {
      for (const callback of callbacks) callback();
    });
    expect(screen.getByText('Vue').closest('[data-slot="badge"]')).toHaveClass('invisible');
    expect(screen.getByText('+3 more')).not.toHaveClass('invisible');

    vi.unstubAllGlobals();
    offsetWidth.mockRestore();
    clientWidth.mockRestore();
  });

  it('measures once collapse is turned on after a wrapped render', () => {
    const restore = mockLayout(200);
    const selected = ['react', 'vue', 'angular', 'svelte'];
    const { rerender } = render(
      <MultiSelect options={mockOptions} selected={selected} onChange={vi.fn()} />
    );
    expect(screen.queryByText(/more$/)).not.toBeInTheDocument();

    rerender(
      <MultiSelect
        options={mockOptions}
        selected={selected}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('+3 more')).not.toHaveClass('invisible');
    restore();
  });

  it('re-measures when a badge is relabelled with the same value', () => {
    const restore = mockLayout(200);
    const props = { selected: ['react', 'vue'], onChange: vi.fn(), overflow: 'collapse' as const };
    const { rerender } = render(<MultiSelect options={mockOptions} {...props} />);
    // Two 80px badges fit 200px.
    expect(screen.queryByText(/^\+\d+ more$/)?.closest('[data-slot="badge"]')).toHaveClass(
      'invisible'
    );
    offsetWidthFor.react = 150;
    rerender(
      <MultiSelect
        options={mockOptions.map((option) =>
          option.value === 'react' ? { ...option, label: 'React Native' } : option
        )}
        {...props}
      />
    );
    expect(screen.getByText('+1 more')).not.toHaveClass('invisible');
    delete offsetWidthFor.react;
    restore();
  });

  it('measures the first badge at its natural width while others are shown', () => {
    // All four render before the first measurement; the first must not be shrinkable then, or its
    // squeezed width would make extra badges look like they fit.
    const restore = mockLayout(400);
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue', 'angular', 'svelte']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('React').closest('[data-slot="badge"]')).toHaveClass('shrink-0');
    expect(screen.getByText('React').closest('[data-slot="badge"]')).not.toHaveClass('min-w-0');
    restore();
  });

  it('keeps one badge in a field too narrow for it', () => {
    const restore = mockLayout(50);
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react', 'vue']}
        onChange={vi.fn()}
        overflow="collapse"
      />
    );
    expect(screen.getByText('React').closest('[data-slot="badge"]')).not.toHaveClass('invisible');
    expect(screen.getByText('+1 more')).toBeInTheDocument();
    // The kept badge may shrink, so the count beside it stays in view.
    expect(screen.getByText('React').closest('[data-slot="badge"]')).toHaveClass('min-w-0');
    expect(screen.getByText('React').closest('[data-slot="badge"]')).not.toHaveClass('shrink-0');
    restore();
  });
});

describe('MultiSelect create', () => {
  it('offers the query when nothing matches it, and passes it on', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} onCreate={onCreate} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), '  new.person@example.com ');
    await user.click(screen.getByRole('option', { name: 'Add "new.person@example.com"' }));
    expect(onCreate).toHaveBeenCalledWith('new.person@example.com');
    expect(screen.getByPlaceholderText('Search...')).toHaveValue('');
  });

  it('offers the query after the matches', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} onCreate={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'vu');
    const rows = screen.getAllByRole('option');
    expect(rows[0]).toHaveTextContent('Vue');
    expect(rows.at(-1)).toHaveAccessibleName('Add "vu"');
  });

  it('does not offer an exact match again', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} onCreate={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'vue');
    expect(screen.queryByRole('option', { name: /^Add / })).not.toBeInTheDocument();
  });

  it('shows the create row in place of the empty message, and creates on Enter', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={vi.fn()}
        onCreate={onCreate}
        emptyMessage="No users found."
      />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    expect(screen.queryByText('No users found.')).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Add "zzz"' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(onCreate).toHaveBeenCalledWith('zzz');
  });

  it('shows no create row without onCreate or a query', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} onCreate={vi.fn()} />
    );
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('option', { name: /^Add / })).not.toBeInTheDocument();

    rerender(<MultiSelect options={mockOptions} selected={[]} onChange={vi.fn()} />);
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    expect(screen.queryByRole('option', { name: /^Add / })).not.toBeInTheDocument();
  });

  it('disables the create row at maxSelected', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(
      <MultiSelect
        options={mockOptions}
        selected={['react']}
        onChange={vi.fn()}
        onCreate={onCreate}
        maxSelected={1}
      />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    const row = screen.getByRole('option', { name: 'Add "zzz"' });
    expect(row).toHaveAttribute('aria-disabled', 'true');
    await user.click(row);
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('uses a custom create label', async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect
        options={mockOptions}
        selected={[]}
        onChange={vi.fn()}
        onCreate={vi.fn()}
        createLabel={(query) => `Invite ${query}`}
      />
    );
    await user.click(screen.getByRole('combobox'));
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    expect(screen.getByRole('option', { name: 'Invite zzz' })).toBeInTheDocument();
  });
});
