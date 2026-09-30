import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup } from './input-group';
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
    expect(onChange).toHaveBeenCalledWith('$vars.orderId');
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
});
