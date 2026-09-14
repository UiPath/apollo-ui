import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { PromptEditorToolbarActionsRef } from '../types';
import { EditorToolbar } from './EditorToolbar';

/**
 * The editor-level tests prove the buttons RENDER, and the serialization tests prove seeded markdown
 * round-trips — but nothing joined the two: a typo in the `handleFormat('formatUnderline')` action
 * name would leave both green while the button silently did nothing. These cover that seam.
 * Driving a real selection is not an option here (Lexical's `updateDOMSelection` needs layout that
 * happy-dom does not provide), so the toolbar is exercised against a stub actions ref.
 */
const setup = (props: Partial<React.ComponentProps<typeof EditorToolbar>> = {}) => {
  const actions: PromptEditorToolbarActionsRef = {
    formatBold: vi.fn(),
    formatItalic: vi.fn(),
    formatUnderline: vi.fn(),
    formatStrikethrough: vi.fn(),
    formatNumberedList: vi.fn(),
    formatBulletedList: vi.fn(),
    formatCode: vi.fn(),
  };
  const actionsRef =
    createRef<PromptEditorToolbarActionsRef>() as React.RefObject<PromptEditorToolbarActionsRef | null>;
  actionsRef.current = actions;
  render(
    <TooltipProvider>
      <EditorToolbar mode="edit" onModeChange={vi.fn()} actionsRef={actionsRef} {...props} />
    </TooltipProvider>
  );
  return { actions, user: userEvent.setup() };
};

describe('EditorToolbar', () => {
  it('invokes the matching action for every formatting button in rich mode', async () => {
    const { actions, user } = setup({ richText: true });
    const cases: [string, keyof PromptEditorToolbarActionsRef][] = [
      ['Bold', 'formatBold'],
      ['Italic', 'formatItalic'],
      ['Underline', 'formatUnderline'],
      ['Strikethrough', 'formatStrikethrough'],
      ['Numbered List', 'formatNumberedList'],
      ['Bulleted List', 'formatBulletedList'],
      ['Code', 'formatCode'],
    ];
    for (const [label, action] of cases) {
      await user.click(screen.getByRole('button', { name: label }));
      expect(actions[action], `${label} → ${action}`).toHaveBeenCalledTimes(1);
    }
  });

  it('offers Code but not Underline in plain mode', async () => {
    const { actions, user } = setup();
    expect(screen.queryByRole('button', { name: 'Underline' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(actions.formatCode).toHaveBeenCalledTimes(1);
  });

  it('does not invoke formatting actions while previewing', async () => {
    const { actions, user } = setup({ mode: 'preview' });
    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(actions.formatCode).not.toHaveBeenCalled();
  });
});
