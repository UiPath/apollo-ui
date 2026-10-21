import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../utils/testing';
import { EditableText, type EditableTextProps } from './EditableText';

// The editing behaviour is apollo-wind's and tested there; this covers what the canvas adds.

function Controlled({
  initial,
  ...props
}: { initial: string } & Omit<EditableTextProps, 'value' | 'onChange'>) {
  const [text, setText] = useState(initial);
  return <EditableText {...props} value={text} onChange={setText} />;
}

describe('EditableText', () => {
  it('keeps React Flow from panning or zooming over the text, in read and edit mode', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="End" onSubmit={vi.fn()} aria-label="Node name" />);

    const trigger = screen.getByRole('button', { name: 'Node name: End' });
    expect(trigger).toHaveClass('nodrag', 'nowheel');

    await user.click(trigger);
    expect(screen.getByRole('textbox', { name: 'Node name' })).toHaveClass('nodrag', 'nowheel');
  });

  it('keeps a consumer className alongside', () => {
    render(<EditableText value="End" className="text-brand" />);
    expect(screen.getByText('End')).toHaveClass('nodrag', 'nowheel', 'text-brand');
  });

  it('edits through apollo-wind: Enter submits the trimmed text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Controlled initial="End" onSubmit={onSubmit} aria-label="Node name" />);

    await user.click(screen.getByRole('button', { name: /^Node name/ }));
    await user.keyboard('  Wrap up  {Enter}');

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith('Wrap up');
  });
});
