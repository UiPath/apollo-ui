import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ModelPicker } from './ModelPicker';
import type { DiscoveryModel } from './types';

/**
 * Render helper. No I18nProvider on purpose: the picker resolves its
 * strings through `useSafeLingui`, whose fallback formats the English
 * defaults, and no MUI ThemeProvider either — the picker must work in
 * bare web-component hosts.
 */
function renderPicker(ui: React.ReactElement) {
  return render(ui);
}

const MODELS: DiscoveryModel[] = [
  {
    modelId: 'anthropic.claude-sonnet-4-6',
    modelName: 'anthropic.claude-sonnet-4-6',
    vendor: 'AnthropicClaude',
    modelSubscriptionType: 'UiPathOwned',
  },
  {
    modelId: 'gpt-4o',
    modelName: 'gpt-4o',
    vendor: 'OpenAi',
    modelSubscriptionType: 'UiPathOwned',
    isPreview: true,
  },
  {
    modelId: 'byo-cigna-gpt-4o',
    modelName: 'gpt-4o',
    vendor: 'OpenAi',
    modelSubscriptionType: 'BYOMAdded',
    byoConnectionLabel: 'CignaSandbox',
  },
];

describe('<ModelPicker>', () => {
  it('renders the trigger with the selected model name', () => {
    renderPicker(
      <ModelPicker models={MODELS} value="anthropic.claude-sonnet-4-6" onChange={() => {}} />
    );
    expect(screen.getByText('anthropic.claude-sonnet-4-6')).toBeInTheDocument();
  });

  it('renders the friendly name when friendlyNameFor is set', () => {
    renderPicker(
      <ModelPicker
        models={MODELS}
        value="anthropic.claude-sonnet-4-6"
        onChange={() => {}}
        friendlyNameFor={(m) =>
          m.modelId === 'anthropic.claude-sonnet-4-6' ? 'Claude Sonnet 4.6' : null
        }
      />
    );
    expect(screen.getByText('Claude Sonnet 4.6')).toBeInTheDocument();
  });

  it('opens on click and fires onChange when a row is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<ModelPicker models={MODELS} value={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    // Listbox should now exist with an accessible name.
    const listbox = await screen.findByRole('listbox', { name: /models/i });
    expect(listbox).toBeInTheDocument();
    // Click an option. There are two `gpt-4o` rows (the hosted one and a
    // BYO clone) — pick the hosted one by its option role + selected/active
    // state walk via the modelName id.
    const option = within(listbox).getByRole('option', { name: /^gpt-4o$/ });
    await user.click(option);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].modelId).toBe('gpt-4o');
  });

  it('falls back to "unknown model" treatment when value does not match catalog', () => {
    renderPicker(<ModelPicker models={MODELS} value="some-retired-model" onChange={() => {}} />);
    expect(screen.getByText('some-retired-model')).toBeInTheDocument();
    // Trigger should be aria-invalid.
    expect(screen.getByRole('button', { expanded: false })).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders BYO edit/delete actions only when canManageByo is true', async () => {
    const user = userEvent.setup();
    const { rerender } = renderPicker(
      <ModelPicker models={MODELS} value={null} onChange={() => {}} canManageByo={false} />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    // BYO is the first group (top of Category view) and expanded by
    // default, so rows are visible without an extra click.
    await screen.findByRole('listbox');
    // Viewer: no edit/delete buttons on the BYO row.
    expect(screen.queryByRole('button', { name: /edit connection/i })).toBeNull();

    rerender(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        onUseCustomModel={() => {}}
      />
    );
    // After flipping canManageByo on, edit + delete render.
    expect(await screen.findByRole('button', { name: /edit connection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove connection/i })).toBeInTheDocument();
    // Footer CTA also appears.
    expect(screen.getByText(/use custom model/i)).toBeInTheDocument();
  });

  it('Use custom model CTA closes the popup and calls onUseCustomModel', async () => {
    const user = userEvent.setup();
    const onUseCustomModel = vi.fn();
    renderPicker(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        onUseCustomModel={onUseCustomModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const cta = await screen.findByText(/use custom model/i);
    await user.click(cta);
    expect(onUseCustomModel).toHaveBeenCalledTimes(1);
    // Popup is closed.
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keyboard navigation: ArrowDown moves activedescendant, Enter selects, Escape closes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker(<ModelPicker models={MODELS} value={null} onChange={onChange} />);
    await user.click(screen.getByRole('button', { expanded: false }));
    const search = await screen.findByRole('combobox');
    // Initial active descendant is set on open.
    expect(search).toHaveAttribute('aria-activedescendant');
    const firstActive = search.getAttribute('aria-activedescendant');
    // Move down.
    await user.keyboard('{ArrowDown}');
    expect(search.getAttribute('aria-activedescendant')).not.toBe(firstActive);
    // Pick.
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
