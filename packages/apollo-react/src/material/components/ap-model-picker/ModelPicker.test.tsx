import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ModelPicker } from './ModelPicker';
import type { DiscoveryModel } from './types';
import { platformNavigation } from './usePlatformAccess';

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

  it('renders the Discovery displayName as the friendly label', () => {
    const models = MODELS.map((m) =>
      m.modelId === 'anthropic.claude-sonnet-4-6' ? { ...m, displayName: 'Sonnet From DTO' } : m
    );
    renderPicker(
      <ModelPicker models={models} value="anthropic.claude-sonnet-4-6" onChange={() => {}} />
    );
    expect(screen.getByText('Sonnet From DTO')).toBeInTheDocument();
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

  it('keeps rendering a selection the host filter excluded', () => {
    renderPicker(
      <ModelPicker
        models={MODELS}
        value="gpt-4o"
        onChange={() => {}}
        filter={(m) => m.vendor !== 'OpenAi'}
      />
    );
    // The stored selection resolves from the raw catalog, so the trigger
    // shows the model instead of a blank placeholder (README §1).
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
  });

  it('falls back to "unknown model" treatment when value does not match catalog', () => {
    renderPicker(<ModelPicker models={MODELS} value="some-retired-model" onChange={() => {}} />);
    expect(screen.getByText('some-retired-model')).toBeInTheDocument();
    // Trigger should be aria-invalid.
    expect(screen.getByRole('button', { expanded: false })).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders the BYO edit action only when canManageByo is true', async () => {
    const user = userEvent.setup();
    const requestContext = {
      token: 't',
      tenantName: 'DefaultTenant',
      tenantId: 'tenant-guid',
    };
    const { rerender } = renderPicker(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo={false}
        requestContext={requestContext}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    // BYO is the first group (top of Category view) and expanded by
    // default, so rows are visible without an extra click.
    await screen.findByRole('listbox');
    // Viewer: no edit button on the BYO row.
    expect(screen.queryByRole('button', { name: /edit configuration/i })).toBeNull();

    rerender(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        requestContext={requestContext}
      />
    );
    // After flipping canManageByo on, the edit action renders. There is
    // deliberately no delete: removal lives on the configurations page.
    expect(await screen.findByRole('button', { name: /edit configuration/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).toBeNull();
    // Footer CTA also appears.
    expect(screen.getByText(/use custom model/i)).toBeInTheDocument();
  });

  it('navigates to the LLM-configurations pages in a new tab (add CTA + row edit)', async () => {
    const user = userEvent.setup();
    const assign = vi.spyOn(platformNavigation, 'openInNewTab').mockImplementation(() => {});
    try {
      renderPicker(
        <ModelPicker
          models={MODELS}
          value={null}
          onChange={() => {}}
          canManageByo
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
            tenantId: 'tenant-guid',
            requestingProduct: 'agents',
            requestingFeature: 'design-eval-deploy',
          }}
          enableFolders
          folders={[{ id: 'folder-key', label: 'Shared', numericId: 2241521 }]}
          folder="folder-key"
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));

      // Row edit: no configuration id on the DTO yet, so it falls back
      // to the configurations list scoped to tenant + folder.
      await user.click(await screen.findByRole('button', { name: /edit configuration/i }));
      expect(assign).toHaveBeenLastCalledWith(
        'https://cloud.local/acme/portal_/admin/ai-trust-layer/llm-configurations' +
          '?tenantId=tenant-guid&folderId=2241521'
      );

      // Footer CTA: deep-links to the add form, pre-populated with the
      // picker's product/feature.
      await user.click(screen.getByText(/use custom model/i));
      expect(assign).toHaveBeenLastCalledWith(
        'https://cloud.local/acme/portal_/admin/ai-trust-layer/llm-configurations' +
          '/tenant-guid/2241521/add?product=agents&feature=design-eval-deploy'
      );
    } finally {
      assign.mockRestore();
    }
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

  it('falls back to the first folder for the add deep-link when none is selected', async () => {
    const user = userEvent.setup();
    const assign = vi.spyOn(platformNavigation, 'openInNewTab').mockImplementation(() => {});
    try {
      renderPicker(
        <ModelPicker
          models={MODELS}
          value={null}
          onChange={() => {}}
          canManageByo
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
            tenantId: 'tenant-guid',
            requestingProduct: 'agents',
            requestingFeature: 'design-eval-deploy',
          }}
          enableFolders
          folders={[{ id: 'folder-key', label: 'Shared', numericId: 2241521 }]}
          // No `folder` selected ("All folders") — should still deep-link
          // /add using the first available folder, not fall back to the list.
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(screen.getByText(/use custom model/i));
      expect(assign).toHaveBeenLastCalledWith(
        'https://cloud.local/acme/portal_/admin/ai-trust-layer/llm-configurations' +
          '/tenant-guid/2241521/add?product=agents&feature=design-eval-deploy'
      );
    } finally {
      assign.mockRestore();
    }
  });

  it('renders a delete row action on BYO rows when onDeleteModel is provided', async () => {
    const user = userEvent.setup();
    const onDeleteModel = vi.fn();
    renderPicker(
      <ModelPicker
        models={MODELS}
        value={null}
        onChange={() => {}}
        canManageByo
        onDeleteModel={onDeleteModel}
      />
    );
    await user.click(screen.getByRole('button', { expanded: false }));
    const deleteButton = await screen.findByRole('button', { name: /delete configuration/i });
    await user.click(deleteButton);
    expect(onDeleteModel).toHaveBeenCalledTimes(1);
    // Called with the BYO model row.
    expect(onDeleteModel.mock.calls[0][0]).toMatchObject({ modelSubscriptionType: 'BYOMAdded' });
  });

  it('deep-links the edit form when the DTO carries byomDetails.byoConfigurationId', async () => {
    const user = userEvent.setup();
    const assign = vi.spyOn(platformNavigation, 'openInNewTab').mockImplementation(() => {});
    try {
      const models: DiscoveryModel[] = MODELS.map((m) =>
        m.modelSubscriptionType === 'BYOMAdded'
          ? {
              ...m,
              byomDetails: {
                availableOperationCodes: [],
                integrationServiceConnectionId: 'conn-1',
                defaultModel: 'gpt-4o',
                byoConfigurationId: 'cfg-123',
              },
            }
          : m
      );
      renderPicker(
        <ModelPicker
          models={models}
          value={null}
          onChange={() => {}}
          canManageByo
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
            tenantId: 'tenant-guid',
            requestingProduct: 'agents',
            requestingFeature: 'design-eval-deploy',
          }}
          enableFolders
          folders={[{ id: 'folder-key', label: 'Shared', numericId: 2241521 }]}
          folder="folder-key"
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(await screen.findByRole('button', { name: /edit configuration/i }));
      expect(assign).toHaveBeenLastCalledWith(
        'https://cloud.local/acme/portal_/admin/ai-trust-layer/llm-configurations' +
          '/tenant-guid/2241521/edit/cfg-123'
      );
    } finally {
      assign.mockRestore();
    }
  });

  it('resolves BYO connection names from Integration Service when the DTO lacks a label', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'conn-1', name: 'Acme Azure OpenAI' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const models: DiscoveryModel[] = [
        ...MODELS,
        {
          modelId: 'byo-acme-gpt-4o',
          modelName: 'gpt-4o',
          vendor: 'OpenAi',
          modelSubscriptionType: 'BYOMAdded',
          byomDetails: { integrationServiceConnectionId: 'conn-1' },
        },
      ];
      renderPicker(
        <ModelPicker
          models={models}
          value={null}
          onChange={() => {}}
          canManageByo={false}
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
          }}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      expect(await screen.findByText('Acme Azure OpenAI')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        'https://cloud.local/acme/DefaultTenant/connections_/api/v1/Connections/conn-1',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer t' }),
        })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not look up connections whose DTO already carries a host-supplied label', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    try {
      const models: DiscoveryModel[] = [
        {
          modelId: 'byo-cigna-gpt-4o',
          modelName: 'gpt-4o',
          vendor: 'OpenAi',
          modelSubscriptionType: 'BYOMAdded',
          byoConnectionLabel: 'CignaSandbox',
          byomDetails: { integrationServiceConnectionId: 'conn-1' },
        },
      ];
      renderPicker(
        <ModelPicker
          models={models}
          value={null}
          onChange={() => {}}
          canManageByo={false}
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
          }}
        />
      );
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('fetches the Discovery catalog itself when models is omitted', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          modelId: 'gpt-6-mini',
          modelName: 'gpt-6-mini',
          displayName: 'GPT-6 mini',
          vendor: 'OpenAi',
          modelSubscriptionType: 'UiPathOwned',
        },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderPicker(
        <ModelPicker
          value={null}
          onChange={() => {}}
          canManageByo={false}
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
            requestingProduct: 'agents',
            requestingFeature: 'agents-prompt',
            userId: 'user-1',
          }}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      expect(await screen.findByText('GPT-6 mini')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith(
        'https://cloud.local/acme/DefaultTenant/llmgateway_/api/discovery',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer t',
            'X-UiPath-LlmGateway-RequestingProduct': 'agents',
            'X-UiPath-LlmGateway-RequestingFeature': 'agents-prompt',
            'X-UiPath-LlmGateway-UserId': 'user-1',
          }),
        })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('self-fetch mode refetches Discovery scoped to the folder picked in the switcher', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    try {
      renderPicker(
        <ModelPicker
          value={null}
          onChange={() => {}}
          canManageByo={false}
          requestContext={{
            token: 't',
            baseUrl: 'https://cloud.local/acme',
            tenantName: 'DefaultTenant',
            userId: 'user-1',
          }}
          enableFolders
          folders={[{ id: 'folder-key', label: 'Shared', numericId: 1 }]}
        />
      );
      await user.click(screen.getByRole('button', { expanded: false }));
      await user.click(await screen.findByRole('button', { name: /all folders/i }));
      await user.click(await screen.findByRole('menuitem', { name: /shared/i }));

      const discoveryCalls = fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith('/llmgateway_/api/discovery')
      );
      expect(discoveryCalls.length).toBe(2);
      expect(discoveryCalls[1][1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-UiPath-FolderKey': 'folder-key' }),
        })
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
