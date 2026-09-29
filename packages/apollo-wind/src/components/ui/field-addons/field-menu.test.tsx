import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sparkles, Type, Variable } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { FieldMenu } from './field-menu';

const open = async (name = 'Fixed value') => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name }));
  return user;
};

const itemOf = async (text: string) =>
  (await screen.findByText(text)).closest('[role^="menuitem"]') as HTMLElement;

describe('FieldMenu', () => {
  it('labels the trigger with the CURRENT mode', () => {
    render(<FieldMenu mode="expression" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Expression' })).toBeInTheDocument();
  });

  it('names the trigger with triggerLabel while it offers modes', () => {
    const { rerender } = render(
      <FieldMenu mode="expression" onSelect={vi.fn()} triggerLabel="Choose value mode" />
    );
    expect(screen.getByRole('button', { name: 'Choose value mode' })).toBeInTheDocument();

    // With only actions it is the overflow menu, named by `fieldActions`.
    rerender(
      <FieldMenu
        mode="expression"
        onSelect={vi.fn()}
        triggerLabel="Choose value mode"
        modesDisabled
        actions={[{ id: 'clear', label: 'Clear value', onSelect: vi.fn() }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Field actions' })).toBeInTheDocument();
  });

  it('announces which mode is current, as a single choice', async () => {
    render(<FieldMenu mode="expression" onSelect={vi.fn()} />);
    await open('Expression');
    const [literal, expression] = await screen.findAllByRole('menuitemradio');
    expect(literal).toHaveAttribute('aria-checked', 'false');
    expect(expression).toHaveAttribute('aria-checked', 'true');
  });

  it('offers both modes and reports the pick', async () => {
    const onSelect = vi.fn();
    render(<FieldMenu mode="literal" onSelect={onSelect} />);
    const user = await open();

    await user.click(await screen.findByText('Expression'));
    expect(onSelect).toHaveBeenCalledWith('expression');
  });

  it('hides the modes but still renders for actions alone, under an overflow trigger', async () => {
    const onSelect = vi.fn();
    render(
      <FieldMenu
        mode="literal"
        modesDisabled
        onSelect={onSelect}
        actions={[{ id: 'clear', label: 'Clear value', onSelect: vi.fn() }]}
      />
    );
    const user = await open('Field actions');

    expect(await screen.findByText('Clear value')).toBeInTheDocument();
    expect(screen.queryByText('Expression')).toBeNull();
    await user.click(screen.getByText('Clear value'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('styles a destructive action', async () => {
    render(
      <FieldMenu
        mode="literal"
        onSelect={vi.fn()}
        actions={[{ id: 'remove', label: 'Remove', destructive: true, onSelect: vi.fn() }]}
      />
    );
    await open();
    expect(await itemOf('Remove')).toHaveClass('text-error');
  });

  it('marks the mode named by `checked` when it differs from the trigger', async () => {
    render(<FieldMenu mode="literal" checked="expression" onSelect={vi.fn()} />);
    await open();

    expect(await itemOf('Expression')).toHaveAttribute('data-active');
    expect(await itemOf('Fixed value')).not.toHaveAttribute('data-active');
    expect(screen.getByText('Expression')).toHaveClass('text-brand');
  });

  it('names the fixed mode the same for every type', () => {
    render(<FieldMenu mode="literal" expectedType="boolean" onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Fixed value' })).toBeInTheDocument();
  });

  it('describes the fixed mode by type', async () => {
    render(<FieldMenu mode="literal" expectedType="boolean" onSelect={vi.fn()} />);
    await open();
    expect(await screen.findByText('Select true or false')).toBeInTheDocument();
  });

  describe('trigger geometry', () => {
    it('is the square icon button an InputGroupAddon expects', () => {
      render(<FieldMenu mode="literal" onSelect={vi.fn()} />);
      const trigger = screen.getByRole('button', { name: 'Fixed value' });

      expect(trigger).toHaveClass('size-6');
      expect(trigger).not.toHaveClass('border-l');
      expect(trigger).not.toHaveClass('self-stretch');
    });
  });

  describe('custom modes (data-driven)', () => {
    const CUSTOM_MODES = [
      {
        id: 'prompt' as const,
        title: 'Prompt',
        description: 'Describe the value for the agent to fill in',
        icon: Sparkles,
      },
      {
        id: 'variable' as const,
        title: 'Variable',
        description: 'Bind to a variable from the flow',
        icon: Variable,
      },
      {
        id: 'text-builder' as const,
        title: 'Fixed value',
        description: 'Enter a value directly',
        icon: Type,
      },
    ];
    type CustomId = (typeof CUSTOM_MODES)[number]['id'];

    it('labels the trigger with the active custom mode and renders every item with its description', async () => {
      const onSelect = vi.fn();
      render(<FieldMenu<CustomId> mode="prompt" modes={CUSTOM_MODES} onSelect={onSelect} />);
      const user = await open('Prompt');

      expect(await screen.findByText('Variable')).toBeInTheDocument();
      expect(screen.getByText('Fixed value')).toBeInTheDocument();
      expect(screen.getByText('Describe the value for the agent to fill in')).toBeInTheDocument();
      expect(screen.getByText('Bind to a variable from the flow')).toBeInTheDocument();

      await user.click(screen.getByText('Variable'));
      expect(onSelect).toHaveBeenCalledWith('variable');
    });

    it('marks the active custom item', async () => {
      render(<FieldMenu<CustomId> mode="variable" modes={CUSTOM_MODES} onSelect={vi.fn()} />);
      await open('Variable');
      const item = await itemOf('Bind to a variable from the flow');
      expect(item).toHaveAttribute('data-active');
      expect(item.querySelector('svg.text-brand')).not.toBeNull();
    });

    it('never renders modes outside the supplied list (no Expression by construction)', async () => {
      render(<FieldMenu<CustomId> mode="prompt" modes={CUSTOM_MODES} onSelect={vi.fn()} />);
      await open('Prompt');
      await screen.findByText('Variable');
      expect(screen.queryByText('Expression')).toBeNull();
    });

    it('still lists actions under custom modes, separated', async () => {
      const onClear = vi.fn();
      render(
        <FieldMenu<CustomId>
          mode="prompt"
          modes={CUSTOM_MODES}
          onSelect={vi.fn()}
          actions={[{ id: '__clear__', label: 'Clear value', onSelect: onClear }]}
        />
      );
      const user = await open('Prompt');
      expect(await screen.findByRole('separator')).toBeInTheDocument();
      await user.click(await screen.findByText('Clear value'));
      expect(onClear).toHaveBeenCalled();
    });
  });

  it('lists extra modes ahead of the built-in pair', async () => {
    render(
      <FieldMenu
        mode="literal"
        onSelect={vi.fn()}
        extraModes={[{ id: 'literal', title: 'Prompt', icon: Sparkles }]}
      />
    );
    await open('Prompt');
    const items = await screen.findAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      'Prompt',
      'Fixed valueEnter a value directly',
      'ExpressionJavaScript expression',
    ]);
  });

  it('renders the host’s translations', async () => {
    render(
      <FieldMenu
        mode="literal"
        onSelect={vi.fn()}
        strings={{ literalTitle: 'Valeur fixe', expressionTitle: 'Expression JS' }}
      />
    );
    await open('Valeur fixe');
    expect(await screen.findByText('Expression JS')).toBeInTheDocument();
  });

  describe('built-in modes', () => {
    it('keeps the default pair to Fixed value and Expression', async () => {
      render(<FieldMenu mode="literal" onSelect={vi.fn()} />);
      await open();
      const items = await screen.findAllByRole('menuitemradio');
      expect(items.map((item) => item.textContent)).toEqual([
        'Fixed valueEnter a value directly',
        'ExpressionJavaScript expression',
      ]);
    });

    it('lists all four when asked by id, in the given order', async () => {
      const onSelect = vi.fn();
      render(
        <FieldMenu
          mode="variable"
          modes={['prompt', 'variable', 'literal', 'expression']}
          onSelect={onSelect}
        />
      );
      const user = await open('Variable');
      const items = await screen.findAllByRole('menuitemradio');
      expect(items.map((item) => item.textContent)).toEqual([
        'PromptDescribe the value for the agent to fill in',
        'VariableBind to a variable',
        'Fixed valueEnter a value directly',
        'ExpressionJavaScript expression',
      ]);

      await user.click(screen.getByText('Prompt'));
      expect(onSelect).toHaveBeenCalledWith('prompt');
    });

    it('translates built-in ids through `strings`', async () => {
      render(
        <FieldMenu
          mode="prompt"
          modes={['prompt']}
          onSelect={vi.fn()}
          strings={{ promptTitle: 'Invite', promptDescription: 'Décrivez la valeur' }}
        />
      );
      await open('Invite');
      expect(await screen.findByText('Décrivez la valeur')).toBeInTheDocument();
    });

    it('mixes built-in ids with a vocabulary’s own options', async () => {
      render(
        <FieldMenu<'variable' | 'widget'>
          mode="widget"
          modes={[{ id: 'widget', title: 'Browse', icon: Type }, 'variable']}
          onSelect={vi.fn()}
        />
      );
      await open('Browse');
      expect(await screen.findByText('Bind to a variable')).toBeInTheDocument();
    });
  });
});
