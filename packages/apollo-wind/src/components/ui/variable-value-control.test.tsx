import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Hash } from 'lucide-react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup } from './input-group';
import type { RenderVariablePicker } from './variable-picker';
import { VariableValueControl } from './variable-value-control';

const variables = [{ id: 'order', label: 'Order id', value: '$vars.orderId' }];

describe('VariableValueControl', () => {
  it('shows the bound reference, or the placeholder while none is bound', () => {
    const { rerender } = render(
      <InputGroup>
        <VariableValueControl aria-label="Ref" onChange={vi.fn()} variables={[]} />
      </InputGroup>
    );
    expect(screen.getByRole('button', { name: 'Ref' })).toHaveTextContent('Select a variable');
    rerender(
      <InputGroup>
        <VariableValueControl
          aria-label="Ref"
          value="$vars.orderId"
          onChange={vi.fn()}
          variables={[]}
        />
      </InputGroup>
    );
    expect(screen.getByRole('button', { name: 'Ref' })).toHaveTextContent('$vars.orderId');
  });

  it('replaces the reference with a pick, resolving a function only when opened', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const source = vi.fn(() => variables);
    render(
      <InputGroup>
        <VariableValueControl
          aria-label="Ref"
          value="$vars.old"
          onChange={onChange}
          variables={source}
        />
      </InputGroup>
    );
    expect(source).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Ref' }));
    expect(source).toHaveBeenCalledTimes(1);
    await user.click(await screen.findByText('Order id'));
    expect(onChange).toHaveBeenCalledWith(
      '$vars.orderId',
      expect.objectContaining({ label: 'Order id', value: '$vars.orderId' })
    );
    expect(screen.queryByPlaceholderText('Search variables...')).toBeNull();
  });

  it('reports blur and hands its trigger to an input ref', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    const inputRef = createRef<HTMLButtonElement>();
    render(
      <InputGroup>
        <VariableValueControl
          aria-label="Ref"
          onChange={vi.fn()}
          onBlur={onBlur}
          inputRef={inputRef}
          variables={[]}
        />
        <button type="button">After</button>
      </InputGroup>
    );
    expect(inputRef.current).toBe(screen.getByRole('button', { name: 'Ref' }));
    screen.getByRole('button', { name: 'Ref' }).focus();
    await user.tab();
    expect(onBlur).toHaveBeenCalled();
  });

  it('takes translated strings', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup>
        <VariableValueControl
          aria-label="Ref"
          onChange={vi.fn()}
          variables={[]}
          strings={{
            variablePlaceholder: 'Choisir',
            variableSearchPlaceholder: 'Rechercher',
            variableEmpty: 'Aucune',
          }}
        />
      </InputGroup>
    );
    expect(screen.getByRole('button', { name: 'Ref' })).toHaveTextContent('Choisir');
    await user.click(screen.getByRole('button', { name: 'Ref' }));
    expect(await screen.findByPlaceholderText('Rechercher')).toBeInTheDocument();
    expect(screen.getByText('Aucune')).toBeInTheDocument();
  });

  describe('with a host picker', () => {
    const hostPicker: RenderVariablePicker = ({ value, onSelect, close }) => (
      <div>
        <p>Bound: {value ?? 'nothing'}</p>
        <button type="button" onClick={() => onSelect('$host.orderId')}>
          Host order id
        </button>
        <button type="button" onClick={close}>
          Host cancel
        </button>
      </div>
    );

    it('hands it the bound reference, writes its pick and returns focus', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <InputGroup>
          <VariableValueControl
            aria-label="Ref"
            value="$vars.old"
            onChange={onChange}
            renderPicker={hostPicker}
          />
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Ref' });
      await user.click(trigger);
      expect(await screen.findByText('Bound: $vars.old')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search variables...')).toBeNull();
      await user.click(screen.getByRole('button', { name: 'Host order id' }));
      // A host pick is the reference alone: there is no entry to hand on.
      expect(onChange).toHaveBeenCalledWith('$host.orderId', undefined);
      expect(screen.queryByText('Bound: $vars.old')).toBeNull();
      expect(trigger).toHaveFocus();
    });

    it('closes without writing', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(
        <InputGroup>
          <VariableValueControl aria-label="Ref" onChange={onChange} renderPicker={hostPicker} />
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Ref' });
      await user.click(trigger);
      expect(await screen.findByText('Bound: nothing')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Host cancel' }));
      expect(onChange).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
    });
  });

  describe('describeReference', () => {
    it("shows the host's label and icon in the chip and the trigger's name", () => {
      const describe$ = vi.fn((reference: string) =>
        reference === '$vars.orderId'
          ? { label: 'Order id', icon: <Hash data-testid="number-icon" /> }
          : undefined
      );
      const { rerender } = render(
        <InputGroup>
          <VariableValueControl
            value="$vars.orderId"
            onChange={vi.fn()}
            variables={[]}
            describeReference={describe$}
          />
        </InputGroup>
      );
      const trigger = screen.getByRole('button', { name: 'Order id' });
      expect(trigger).not.toHaveTextContent('$vars.orderId');
      expect(trigger.querySelector('[data-slot="reference-chip"]')).toHaveTextContent('Order id');
      expect(screen.getByTestId('number-icon')).toBeInTheDocument();
      expect(describe$).toHaveBeenCalledWith('$vars.orderId');

      rerender(
        <InputGroup>
          <VariableValueControl
            value="$vars.gone"
            onChange={vi.fn()}
            variables={[]}
            describeReference={describe$}
          />
        </InputGroup>
      );
      expect(screen.getByRole('button', { name: '$vars.gone' })).toBeInTheDocument();
      expect(screen.queryByTestId('number-icon')).toBeNull();
    });

    it('is not asked while nothing is bound', () => {
      const describe$ = vi.fn(() => ({ label: 'x' }));
      render(
        <InputGroup>
          <VariableValueControl
            aria-label="Ref"
            onChange={vi.fn()}
            variables={[]}
            describeReference={describe$}
          />
        </InputGroup>
      );
      expect(describe$).not.toHaveBeenCalled();
    });
  });
});
