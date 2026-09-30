import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup } from './input-group';
import { PromptValueControl } from './prompt-value-control';

describe('PromptValueControl', () => {
  it('edits the prompt in a textarea, with its placeholder', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InputGroup variant="agent" layout="grow">
        <PromptValueControl aria-label="Prompt" value="" onChange={onChange} />
      </InputGroup>
    );
    const textarea = screen.getByRole('textbox', { name: 'Prompt' });
    expect(textarea).toHaveAttribute('placeholder', 'Describe the value');
    await user.type(textarea, 'x');
    expect(onChange).toHaveBeenCalledWith('x');
  });

  it('hands its textarea to an input ref as well as its own ref', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const inputRef = createRef<HTMLTextAreaElement>();
    render(
      <InputGroup variant="agent">
        <PromptValueControl
          ref={ref}
          inputRef={inputRef}
          aria-label="Prompt"
          value=""
          onChange={vi.fn()}
        />
      </InputGroup>
    );
    const textarea = screen.getByRole('textbox', { name: 'Prompt' });
    expect(ref.current).toBe(textarea);
    expect(inputRef.current).toBe(textarea);
  });

  it('ignores props it does not take, as a registered control is handed', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const extra = { mode: 'prompt', requestModeSwitch: vi.fn() } as object;
    render(
      <InputGroup variant="agent">
        <PromptValueControl aria-label="Prompt" value="Hi" onChange={vi.fn()} {...extra} />
      </InputGroup>
    );
    expect(screen.getByRole('textbox', { name: 'Prompt' })).not.toHaveAttribute('mode');
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
