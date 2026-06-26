import { describe, expect, it } from 'vitest';
import { render, screen } from '../../utils/testing';
import { PanelChrome } from './PanelChrome';

describe('PanelChrome', () => {
  it('uses an auto-scrolling content area by default', () => {
    render(
      <PanelChrome>
        <div data-testid="content">body</div>
      </PanelChrome>
    );

    const content = screen.getByTestId('content').parentElement;
    expect(content).toHaveStyle({ overflowY: 'auto' });
  });

  it('disables content scrolling when scrollableContent is false', () => {
    render(
      <PanelChrome scrollableContent={false}>
        <div data-testid="content">body</div>
      </PanelChrome>
    );

    const content = screen.getByTestId('content').parentElement;
    expect(content).toHaveStyle({ overflowY: 'hidden' });
  });
});
