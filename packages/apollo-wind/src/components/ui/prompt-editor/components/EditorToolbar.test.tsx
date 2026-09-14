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

  /** The trailing slot's separator is a GROUP boundary, so it only earns its place when a control
   *  precedes it. Rich-mode hosts pass `showModeToggle={false}` and no `onFullscreen`, leaving the
   *  trailing control alone in its group — a separator there divides nothing and `justify-between`
   *  strands it at the group's left edge. */
  describe('trailing separator', () => {
    const countSeparators = () =>
      document.querySelectorAll('[data-testid="editor-toolbar"] span.w-px:not([data-testid])')
        .length;

    it('is omitted when the trailing control is alone in its group', () => {
      setup({
        richText: true,
        showModeToggle: false,
        trailing: <button type="button">Mode</button>,
      });
      // Only the two boundaries inside the formatting cluster remain.
      expect(countSeparators()).toBe(2);
    });

    it('is kept when the mode toggle precedes the trailing control', () => {
      setup({ showModeToggle: true, trailing: <button type="button">Mode</button> });
      expect(countSeparators()).toBe(3);
    });

    it('is kept when only Expand precedes the trailing control', () => {
      setup({
        showModeToggle: false,
        onFullscreen: vi.fn(),
        trailing: <button type="button">Mode</button>,
      });
      expect(countSeparators()).toBe(3);
    });
  });

  it('does not invoke formatting actions while previewing', async () => {
    const { actions, user } = setup({ mode: 'preview' });
    await user.click(screen.getByRole('button', { name: 'Code' }));
    expect(actions.formatCode).not.toHaveBeenCalled();
  });
});
