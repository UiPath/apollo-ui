import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { PaneContextMenu } from './PaneContextMenu';

describe('PaneContextMenu', () => {
  it('uses transient position props without forwarding them to the DOM', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      render(
        <PaneContextMenu
          isOpen
          position={{ x: 24, y: 48 }}
          items={[{ label: 'Open', onClick: vi.fn() }]}
          onClose={vi.fn()}
        />
      );

      const menu = screen.getByRole('button', { name: 'Open' }).parentElement;
      expect(menu).not.toBeNull();
      expect(menu).toHaveStyle({ left: '24px', top: '48px' });
      expect(menu).not.toHaveAttribute('$x');
      expect(menu).not.toHaveAttribute('$y');

      const consoleOutput = consoleError.mock.calls.flat().map(String).join(' ');
      expect(consoleOutput).not.toContain('Invalid attribute name');
    } finally {
      consoleError.mockRestore();
    }
  });
});
